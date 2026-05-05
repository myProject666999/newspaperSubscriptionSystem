package models

import (
	"time"

	"github.com/jinzhu/gorm"
)

type User struct {
	ID          uint       `gorm:"primary_key" json:"id"`
	Username    string     `gorm:"unique_index;size:50;not null" json:"username"`
	Password    string     `gorm:"size:255;not null" json:"-"`
	Email       string     `gorm:"size:100" json:"email"`
	Phone       string     `gorm:"size:20" json:"phone"`
	Nickname    string     `gorm:"size:50" json:"nickname"`
	Avatar      string     `gorm:"size:255" json:"avatar"`
	Role        string     `gorm:"size:20;default:'user'" json:"role"`
	Status      int        `gorm:"default:1" json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `sql:"index" json:"-"`
}

type Category struct {
	ID        uint       `gorm:"primary_key" json:"id"`
	Name      string     `gorm:"size:50;not null" json:"name"`
	Sort      int        `gorm:"default:0" json:"sort"`
	Status    int        `gorm:"default:1" json:"status"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `sql:"index" json:"-"`
}

type Newspaper struct {
	ID          uint       `gorm:"primary_key" json:"id"`
	Title       string     `gorm:"size:200;not null" json:"title"`
	CategoryID  uint       `gorm:"not null" json:"category_id"`
	Category    Category   `gorm:"foreign_key:CategoryID" json:"category"`
	Description string     `gorm:"type:text" json:"description"`
	Image       string     `gorm:"size:255" json:"image"`
	Price       float64    `gorm:"type:decimal(10,2);not null" json:"price"`
	MonthPrice  float64    `gorm:"type:decimal(10,2);not null" json:"month_price"`
	QuarterPrice float64   `gorm:"type:decimal(10,2);not null" json:"quarter_price"`
	YearPrice   float64    `gorm:"type:decimal(10,2);not null" json:"year_price"`
	Sales       int        `gorm:"default:0" json:"sales"`
	Status      int        `gorm:"default:1" json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `sql:"index" json:"-"`
}

type Cart struct {
	ID          uint       `gorm:"primary_key" json:"id"`
	UserID      uint       `gorm:"not null" json:"user_id"`
	NewspaperID uint      `gorm:"not null" json:"newspaper_id"`
	Newspaper   Newspaper  `gorm:"foreign_key:NewspaperID" json:"newspaper"`
	Quantity    int        `gorm:"default:1" json:"quantity"`
	SubscribeType string   `gorm:"size:20;default:'month'" json:"subscribe_type"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type Order struct {
	ID          uint       `gorm:"primary_key" json:"id"`
	OrderNo     string     `gorm:"unique_index;size:50;not null" json:"order_no"`
	UserID      uint       `gorm:"not null" json:"user_id"`
	User        User       `gorm:"foreign_key:UserID" json:"user"`
	TotalAmount float64    `gorm:"type:decimal(10,2);not null" json:"total_amount"`
	Status      int        `gorm:"default:0" json:"status"`
	Address     string     `gorm:"size:500" json:"address"`
	Receiver    string     `gorm:"size:50" json:"receiver"`
	Phone       string     `gorm:"size:20" json:"phone"`
	Remark      string     `gorm:"type:text" json:"remark"`
	PayTime     *time.Time `json:"pay_time"`
	ShipTime    *time.Time `json:"ship_time"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `sql:"index" json:"-"`
}

type OrderItem struct {
	ID          uint       `gorm:"primary_key" json:"id"`
	OrderID     uint       `gorm:"not null" json:"order_id"`
	Order       Order      `gorm:"foreign_key:OrderID" json:"-"`
	NewspaperID uint      `gorm:"not null" json:"newspaper_id"`
	Newspaper   Newspaper  `gorm:"foreign_key:NewspaperID" json:"newspaper"`
	Quantity    int        `gorm:"default:1" json:"quantity"`
	Price       float64    `gorm:"type:decimal(10,2);not null" json:"price"`
	SubscribeType string   `gorm:"size:20" json:"subscribe_type"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type Review struct {
	ID          uint       `gorm:"primary_key" json:"id"`
	UserID      uint       `gorm:"not null" json:"user_id"`
	User        User       `gorm:"foreign_key:UserID" json:"user"`
	NewspaperID uint      `gorm:"not null" json:"newspaper_id"`
	Newspaper   Newspaper  `gorm:"foreign_key:NewspaperID" json:"newspaper"`
	OrderID     uint       `gorm:"not null" json:"order_id"`
	Rating      int        `gorm:"default:5" json:"rating"`
	Content     string     `gorm:"type:text" json:"content"`
	Images      string     `gorm:"type:text" json:"images"`
	Status      int        `gorm:"default:1" json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `sql:"index" json:"-"`
}

func AutoMigrate(db *gorm.DB) {
	db.AutoMigrate(&User{}, &Category{}, &Newspaper{}, &Cart{}, &Order{}, &OrderItem{}, &Review{})
}
