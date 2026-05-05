package config

import (
	"fmt"
	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
}

type ServerConfig struct {
	Port int
	Mode string
}

type DatabaseConfig struct {
	Driver    string
	Host      string
	Port      int
	Username  string
	Password  string
	DBName    string
	Charset   string
	ParseTime bool
	Loc       string
}

type JWTConfig struct {
	Secret string
	Expire int
}

var AppConfig *Config

func InitConfig() {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./config")
	viper.AddConfigPath("../config")

	if err := viper.ReadInConfig(); err != nil {
		panic(fmt.Errorf("读取配置文件失败: %s", err))
	}

	AppConfig = &Config{}
	if err := viper.Unmarshal(AppConfig); err != nil {
		panic(fmt.Errorf("解析配置文件失败: %s", err))
	}

	fmt.Println("配置文件加载成功")
}

func (d *DatabaseConfig) GetDSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=%t&loc=%s",
		d.Username, d.Password, d.Host, d.Port, d.DBName,
		d.Charset, d.ParseTime, d.Loc)
}
