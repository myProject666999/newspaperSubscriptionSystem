package controllers

import (
	"newspaperSubscriptionSystem/database"
	"newspaperSubscriptionSystem/models"
	"newspaperSubscriptionSystem/utils"

	"github.com/gin-gonic/gin"
)

type CartRequest struct {
	NewspaperID   uint   `json:"newspaper_id" binding:"required"`
	Quantity      int    `json:"quantity"`
	SubscribeType string `json:"subscribe_type"`
}

func GetCartList(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "未登录")
		return
	}

	var carts []models.Cart
	if err := database.DB.Preload("Newspaper").Where("user_id = ?", userID).
		Order("id DESC").Find(&carts).Error; err != nil {
		utils.InternalServerError(c, "获取购物车列表失败")
		return
	}

	var totalAmount float64
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
	}

	utils.Success(c, gin.H{
		"list":          carts,
		"total_amount":  totalAmount,
		"total_quantity": len(carts),
	})
}

func AddToCart(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "未登录")
		return
	}

	var req CartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	var newspaper models.Newspaper
	if err := database.DB.First(&newspaper, req.NewspaperID).Error; err != nil {
		utils.NotFound(c, "报刊不存在")
		return
	}

	if newspaper.Status != 1 {
		utils.BadRequest(c, "该报刊已下架")
		return
	}

	var existingCart models.Cart
	result := database.DB.Where("user_id = ? AND newspaper_id = ? AND subscribe_type = ?",
		userID, req.NewspaperID, req.SubscribeType).First(&existingCart)

	if result.Error == nil {
		quantity := existingCart.Quantity
		if req.Quantity > 0 {
			quantity = req.Quantity
		} else {
			quantity += 1
		}
		database.DB.Model(&existingCart).Update("quantity", quantity)
	} else {
		quantity := 1
		if req.Quantity > 0 {
			quantity = req.Quantity
		}
		subscribeType := "month"
		if req.SubscribeType != "" {
			subscribeType = req.SubscribeType
		}
		cart := models.Cart{
			UserID:        userID.(uint),
			NewspaperID:   req.NewspaperID,
			Quantity:      quantity,
			SubscribeType: subscribeType,
		}
		if err := database.DB.Create(&cart).Error; err != nil {
			utils.InternalServerError(c, "添加购物车失败")
			return
		}
	}

	utils.SuccessWithMessage(c, "添加成功", nil)
}

func UpdateCart(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "未登录")
		return
	}

	id := c.Param("id")

	var req CartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	var cart models.Cart
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&cart).Error; err != nil {
		utils.NotFound(c, "购物车记录不存在")
		return
	}

	if req.Quantity > 0 {
		cart.Quantity = req.Quantity
	}
	if req.SubscribeType != "" {
		cart.SubscribeType = req.SubscribeType
	}

	if err := database.DB.Save(&cart).Error; err != nil {
		utils.InternalServerError(c, "更新购物车失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", nil)
}

func RemoveFromCart(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "未登录")
		return
	}

	id := c.Param("id")

	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Cart{}).Error; err != nil {
		utils.InternalServerError(c, "删除购物车失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}

func ClearCart(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "未登录")
		return
	}

	if err := database.DB.Where("user_id = ?", userID).Delete(&models.Cart{}).Error; err != nil {
		utils.InternalServerError(c, "清空购物车失败")
		return
	}

	utils.SuccessWithMessage(c, "清空成功", nil)
}
