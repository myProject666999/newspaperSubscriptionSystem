package controllers

import (
	"fmt"
	"newspaperSubscriptionSystem/database"
	"newspaperSubscriptionSystem/models"
	"newspaperSubscriptionSystem/utils"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
)

type CreateOrderRequest struct {
	CartIDs  []uint `json:"cart_ids" binding:"required"`
	Address  string `json:"address" binding:"required"`
	Receiver string `json:"receiver" binding:"required"`
	Phone    string `json:"phone" binding:"required"`
	Remark   string `json:"remark"`
}

type OrderStatus int

const (
	OrderStatusPending   OrderStatus = 0
	OrderStatusPaid      OrderStatus = 1
	OrderStatusShipped   OrderStatus = 2
	OrderStatusCompleted OrderStatus = 3
	OrderStatusCancelled OrderStatus = 4
)

func generateOrderNo() string {
	now := time.Now()
	return fmt.Sprintf("NS%s%d", now.Format("20060102150405"), now.UnixNano()%10000)
}

func CreateOrder(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "未登录")
		return
	}

	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	if len(req.CartIDs) == 0 {
		utils.BadRequest(c, "请选择要购买的商品")
		return
	}

	var carts []models.Cart
	if err := database.DB.Preload("Newspaper").Where("id IN ? AND user_id = ?", req.CartIDs, userID).
		Find(&carts).Error; err != nil {
		utils.InternalServerError(c, "获取购物车数据失败")
		return
	}

	if len(carts) == 0 {
		utils.BadRequest(c, "购物车记录不存在")
		return
	}

	var totalAmount float64
	var orderItems []models.OrderItem

	for _, cart := range carts {
		var price float64
		switch cart.SubscribeType {
		case "month":
			price = cart.Newspaper.MonthPrice
		case "quarter":
			price = cart.Newspaper.QuarterPrice
		case "year":
			price = cart.Newspaper.YearPrice
		default:
			price = cart.Newspaper.Price
		}

		totalAmount += price * float64(cart.Quantity)

		orderItem := models.OrderItem{
			NewspaperID:   cart.NewspaperID,
			Quantity:      cart.Quantity,
			Price:         price,
			SubscribeType: cart.SubscribeType,
		}
		orderItems = append(orderItems, orderItem)
	}

	tx := database.DB.Begin()

	order := models.Order{
		OrderNo:     generateOrderNo(),
		UserID:      userID.(uint),
		TotalAmount: totalAmount,
		Status:      int(OrderStatusPaid),
		Address:     req.Address,
		Receiver:    req.Receiver,
		Phone:       req.Phone,
		Remark:      req.Remark,
	}

	now := time.Now()
	order.PayTime = &now

	if err := tx.Create(&order).Error; err != nil {
		tx.Rollback()
		utils.InternalServerError(c, "创建订单失败")
		return
	}

	for i := range orderItems {
		orderItems[i].OrderID = order.ID
		if err := tx.Create(&orderItems[i]).Error; err != nil {
			tx.Rollback()
			utils.InternalServerError(c, "创建订单明细失败")
			return
		}

		newspaperID := orderItems[i].NewspaperID
		quantity := orderItems[i].Quantity
		if err := tx.Model(&models.Newspaper{}).Where("id = ?", newspaperID).
			UpdateColumn("sales", gorm.Expr("sales + ?", quantity)).Error; err != nil {
		}
	}

	if err := tx.Where("id IN ?", req.CartIDs).Delete(&models.Cart{}).Error; err != nil {
		tx.Rollback()
		utils.InternalServerError(c, "清空购物车失败")
		return
	}

	tx.Commit()

	utils.SuccessWithMessage(c, "下单成功", gin.H{
		"order_id":  order.ID,
		"order_no":  order.OrderNo,
	})
}

func GetOrderList(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "未登录")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")
	orderNo := c.Query("order_no")

	var orders []models.Order
	var total int64

	query := database.DB.Model(&models.Order{}).Where("user_id = ?", userID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if orderNo != "" {
		query = query.Where("order_no LIKE ?", "%"+orderNo+"%")
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	if err := query.Order("id DESC").Offset(offset).Limit(pageSize).Find(&orders).Error; err != nil {
		utils.InternalServerError(c, "获取订单列表失败")
		return
	}

	for i := range orders {
		var items []models.OrderItem
		database.DB.Preload("Newspaper").Where("order_id = ?", orders[i].ID).Find(&items)
		orders[i].User = models.User{}
	}

	utils.Success(c, gin.H{
		"list":      orders,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetAdminOrderList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")
	orderNo := c.Query("order_no")

	var orders []models.Order
	var total int64

	query := database.DB.Model(&models.Order{}).Preload("User")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if orderNo != "" {
		query = query.Where("order_no LIKE ?", "%"+orderNo+"%")
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	if err := query.Order("id DESC").Offset(offset).Limit(pageSize).Find(&orders).Error; err != nil {
		utils.InternalServerError(c, "获取订单列表失败")
		return
	}

	utils.Success(c, gin.H{
		"list":      orders,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetOrderDetail(c *gin.Context) {
	userID, exists := c.Get("user_id")
	role, roleExists := c.Get("role")

	id := c.Param("id")

	var order models.Order
	query := database.DB.Preload("User").First(&order, id)
	if query.Error != nil {
		utils.NotFound(c, "订单不存在")
		return
	}

	if roleExists && role == "user" && exists {
		if order.UserID != userID.(uint) {
			utils.Forbidden(c, "无权限查看该订单")
			return
		}
	}

	var items []models.OrderItem
	database.DB.Preload("Newspaper").Where("order_id = ?", order.ID).Find(&items)

	utils.Success(c, gin.H{
		"order": order,
		"items": items,
	})
}

func CancelOrder(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "未登录")
		return
	}

	id := c.Param("id")

	var order models.Order
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&order).Error; err != nil {
		utils.NotFound(c, "订单不存在")
		return
	}

	if order.Status != int(OrderStatusPending) && order.Status != int(OrderStatusPaid) {
		utils.BadRequest(c, "该订单状态不支持取消")
		return
	}

	order.Status = int(OrderStatusCancelled)
	if err := database.DB.Save(&order).Error; err != nil {
		utils.InternalServerError(c, "取消订单失败")
		return
	}

	utils.SuccessWithMessage(c, "订单已取消", nil)
}

func ShipOrder(c *gin.Context) {
	id := c.Param("id")

	var order models.Order
	if err := database.DB.First(&order, id).Error; err != nil {
		utils.NotFound(c, "订单不存在")
		return
	}

	if order.Status != int(OrderStatusPaid) {
		utils.BadRequest(c, "该订单状态不支持发货")
		return
	}

	now := time.Now()
	order.Status = int(OrderStatusShipped)
	order.ShipTime = &now

	if err := database.DB.Save(&order).Error; err != nil {
		utils.InternalServerError(c, "发货失败")
		return
	}

	utils.SuccessWithMessage(c, "发货成功", nil)
}

func DeleteOrder(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Delete(&models.Order{}, id).Error; err != nil {
		utils.InternalServerError(c, "删除订单失败")
		return
	}

	database.DB.Where("order_id = ?", id).Delete(&models.OrderItem{})

	utils.SuccessWithMessage(c, "删除成功", nil)
}

func CompleteOrder(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "未登录")
		return
	}

	id := c.Param("id")

	var order models.Order
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&order).Error; err != nil {
		utils.NotFound(c, "订单不存在")
		return
	}

	if order.Status != int(OrderStatusShipped) {
		utils.BadRequest(c, "该订单状态不支持确认收货")
		return
	}

	order.Status = int(OrderStatusCompleted)
	if err := database.DB.Save(&order).Error; err != nil {
		utils.InternalServerError(c, "确认收货失败")
		return
	}

	utils.SuccessWithMessage(c, "确认收货成功", nil)
}
