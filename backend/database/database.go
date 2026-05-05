package database

import (
	"fmt"
	"newspaperSubscriptionSystem/config"
	"newspaperSubscriptionSystem/models"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
	"golang.org/x/crypto/bcrypt"
)

var DB *gorm.DB

func InitDB() {
	var err error
	dsn := config.AppConfig.Database.GetDSN()

	DB, err = gorm.Open("mysql", dsn)
	if err != nil {
		panic(fmt.Errorf("连接数据库失败: %s", err))
	}

	DB.DB().SetMaxIdleConns(10)
	DB.DB().SetMaxOpenConns(100)

	if config.AppConfig.Server.Mode == "debug" {
		DB.LogMode(true)
	}

	models.AutoMigrate(DB)
	seedData()

	fmt.Println("数据库连接成功")
}

func seedData() {
	var adminCount int
	DB.Model(&models.User{}).Where("role = ?", "admin").Count(&adminCount)
	if adminCount == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil {
			fmt.Println("生成管理员密码失败:", err)
			return
		}
		admin := models.User{
			Username: "admin",
			Password: string(hashedPassword),
			Email:    "admin@example.com",
			Nickname: "管理员",
			Role:     "admin",
			Status:   1,
		}
		DB.Create(&admin)
		fmt.Println("默认管理员账号已创建: admin / admin123")
	}

	var categoryCount int
	DB.Model(&models.Category{}).Count(&categoryCount)
	if categoryCount == 0 {
		categories := []models.Category{
			{Name: "新闻综合", Sort: 1},
			{Name: "财经商业", Sort: 2},
			{Name: "科技数码", Sort: 3},
			{Name: "生活时尚", Sort: 4},
			{Name: "体育娱乐", Sort: 5},
			{Name: "文化教育", Sort: 6},
		}
		for _, category := range categories {
			DB.Create(&category)
		}
		fmt.Println("默认分类已创建")
	}
}
