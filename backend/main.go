package main

import (
	"fmt"
	"newspaperSubscriptionSystem/config"
	"newspaperSubscriptionSystem/database"
	"newspaperSubscriptionSystem/routes"
)

func main() {
	config.InitConfig()

	database.InitDB()
	defer database.DB.Close()

	r := routes.SetupRouter()

	addr := fmt.Sprintf(":%d", config.AppConfig.Server.Port)
	fmt.Printf("服务器启动成功，监听端口: %s\n", addr)

	if err := r.Run(addr); err != nil {
		panic(fmt.Errorf("启动服务器失败: %s", err))
	}
}
