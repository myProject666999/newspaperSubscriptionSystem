package controllers

import (
	"newspaperSubscriptionSystem/database"
	"newspaperSubscriptionSystem/models"
	"newspaperSubscriptionSystem/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CreateReviewRequest struct {
	NewspaperID uint   `json:"newspaper_id" binding:"required"`
	OrderID     uint   `json:"order_id" binding:"required"`
	Rating      int    `json:"rating"`
	Content     string `json:"content"`
	Images      string `json:"images"`
}

func CreateReview(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.Unauthorized(c, "未登录")
		return
	}

	var req CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	var existing models.Review
	if database.DB.Where("user_id = ? AND order_id = ? AND newspaper_id = ?",
		userID, req.OrderID, req.NewspaperID).First(&existing).Error == nil {
		utils.BadRequest(c, "您已评价过该商品")
		return
	}

	rating := 5
	if req.Rating >= 1 && req.Rating <= 5 {
		rating = req.Rating
	}

	review := models.Review{
		UserID:      userID.(uint),
		NewspaperID: req.NewspaperID,
		OrderID:     req.OrderID,
		Rating:      rating,
		Content:     req.Content,
		Images:      req.Images,
		Status:      1,
	}

	if err := database.DB.Create(&review).Error; err != nil {
		utils.InternalServerError(c, "创建评价失败")
		return
	}

	utils.SuccessWithMessage(c, "评价成功", review)
}

func GetReviewList(c *gin.Context) {
	newspaperID := c.Query("newspaper_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var reviews []models.Review
	var total int64

	query := database.DB.Model(&models.Review{}).Preload("User").Preload("Newspaper")

	if newspaperID != "" {
		query = query.Where("newspaper_id = ?", newspaperID)
	}

	query = query.Where("status = 1")

	query.Count(&total)

	offset := (page - 1) * pageSize
	if err := query.Order("id DESC").Offset(offset).Limit(pageSize).Find(&reviews).Error; err != nil {
		utils.InternalServerError(c, "获取评价列表失败")
		return
	}

	utils.Success(c, gin.H{
		"list":      reviews,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetAdminReviewList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	newspaperID := c.Query("newspaper_id")

	var reviews []models.Review
	var total int64

	query := database.DB.Model(&models.Review{}).Preload("User").Preload("Newspaper")

	if newspaperID != "" {
		query = query.Where("newspaper_id = ?", newspaperID)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	if err := query.Order("id DESC").Offset(offset).Limit(pageSize).Find(&reviews).Error; err != nil {
		utils.InternalServerError(c, "获取评价列表失败")
		return
	}

	utils.Success(c, gin.H{
		"list":      reviews,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func DeleteReview(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Delete(&models.Review{}, id).Error; err != nil {
		utils.InternalServerError(c, "删除评价失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}
