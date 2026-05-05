package controllers

import (
	"newspaperSubscriptionSystem/database"
	"newspaperSubscriptionSystem/models"
	"newspaperSubscriptionSystem/utils"
	"time"

	"github.com/gin-gonic/gin"
)

func GetSalesStats(c *gin.Context) {
	startTime := c.Query("start_time")
	endTime := c.Query("end_time")

	var start, end time.Time
	var err error

	if startTime != "" {
		start, err = time.Parse("2006-01-02", startTime)
		if err != nil {
			utils.BadRequest(c, "开始时间格式错误")
			return
		}
	} else {
		start = time.Now().AddDate(0, -1, 0)
	}

	if endTime != "" {
		end, err = time.Parse("2006-01-02", endTime)
		if err != nil {
			utils.BadRequest(c, "结束时间格式错误")
			return
		}
		end = end.AddDate(0, 0, 1)
	} else {
		end = time.Now().AddDate(0, 0, 1)
	}

	var totalOrders int64
	var totalAmount float64
	var totalUsers int64
	var totalNewspapers int64

	database.DB.Model(&models.Order{}).Where("created_at >= ? AND created_at < ?", start, end).Count(&totalOrders)

	row := database.DB.Model(&models.Order{}).
		Where("created_at >= ? AND created_at < ? AND status != ?", start, end, 4).
		Select("COALESCE(SUM(total_amount), 0)").Row()
	row.Scan(&totalAmount)

	database.DB.Model(&models.User{}).Where("role = ? AND created_at >= ? AND created_at < ?", "user", start, end).Count(&totalUsers)

	database.DB.Model(&models.Newspaper{}).Where("status = 1").Count(&totalNewspapers)

	type DailyStats struct {
		Date        string  `json:"date"`
		OrderCount  int64   `json:"order_count"`
		TotalAmount float64 `json:"total_amount"`
	}

	var dailyStats []DailyStats
	rows, err := database.DB.Model(&models.Order{}).
		Where("created_at >= ? AND created_at < ? AND status != ?", start, end, 4).
		Select("DATE(created_at) as date, COUNT(*) as order_count, COALESCE(SUM(total_amount), 0) as total_amount").
		Group("DATE(created_at)").
		Order("date ASC").Rows()

	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var stat DailyStats
			rows.Scan(&stat.Date, &stat.OrderCount, &stat.TotalAmount)
			dailyStats = append(dailyStats, stat)
		}
	}

	type CategoryStats struct {
		CategoryID uint   `json:"category_id"`
		Category   string `json:"category"`
		SalesCount int    `json:"sales_count"`
	}

	var categoryStats []CategoryStats
	database.DB.Model(&models.OrderItem{}).
		Joins("JOIN orders ON order_items.order_id = orders.id").
		Joins("JOIN newspapers ON order_items.newspaper_id = newspapers.id").
		Joins("JOIN categories ON newspapers.category_id = categories.id").
		Where("orders.created_at >= ? AND orders.created_at < ? AND orders.status != ?", start, end, 4).
		Select("categories.id as category_id, categories.name as category, SUM(order_items.quantity) as sales_count").
		Group("categories.id, categories.name").
		Scan(&categoryStats)

	type TopNewspaper struct {
		NewspaperID uint    `json:"newspaper_id"`
		Title        string  `json:"title"`
		TotalSales   int     `json:"total_sales"`
		TotalAmount  float64 `json:"total_amount"`
	}

	var topNewspapers []TopNewspaper
	database.DB.Model(&models.OrderItem{}).
		Joins("JOIN orders ON order_items.order_id = orders.id").
		Joins("JOIN newspapers ON order_items.newspaper_id = newspapers.id").
		Where("orders.created_at >= ? AND orders.created_at < ? AND orders.status != ?", start, end, 4).
		Select("newspapers.id as newspaper_id, newspapers.title as title, SUM(order_items.quantity) as total_sales, SUM(order_items.price * order_items.quantity) as total_amount").
		Group("newspapers.id, newspapers.title").
		Order("total_sales DESC").
		Limit(10).
		Scan(&topNewspapers)

	utils.Success(c, gin.H{
		"summary": gin.H{
			"total_orders":     totalOrders,
			"total_amount":     totalAmount,
			"new_users":        totalUsers,
			"total_newspapers": totalNewspapers,
		},
		"daily_stats":      dailyStats,
		"category_stats":   categoryStats,
		"top_newspapers":   topNewspapers,
		"time_range": gin.H{
			"start": start.Format("2006-01-02"),
			"end":   end.AddDate(0, 0, -1).Format("2006-01-02"),
		},
	})
}
