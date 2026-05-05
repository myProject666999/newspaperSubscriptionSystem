package controllers

import (
	"newspaperSubscriptionSystem/database"
	"newspaperSubscriptionSystem/models"
	"newspaperSubscriptionSystem/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

type NewspaperRequest struct {
	Title         string  `json:"title" binding:"required"`
	CategoryID    uint    `json:"category_id" binding:"required"`
	Description   string  `json:"description"`
	Image         string  `json:"image"`
	Price         float64 `json:"price" binding:"required"`
	MonthPrice    float64 `json:"month_price"`
	QuarterPrice  float64 `json:"quarter_price"`
	YearPrice     float64 `json:"year_price"`
	Sales         int     `json:"sales"`
	Status        int     `json:"status"`
}

func GetNewspaperList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")
	categoryID := c.Query("category_id")
	status := c.Query("status")
	sortBy := c.DefaultQuery("sort_by", "id")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	var newspapers []models.Newspaper
	var total int64

	query := database.DB.Model(&models.Newspaper{}).Preload("Category")

	if keyword != "" {
		query = query.Where("title LIKE ? OR description LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	} else {
		query = query.Where("status = 1")
	}

	query.Count(&total)

	orderClause := sortBy + " " + sortOrder
	if sortBy == "sales" {
		orderClause = "sales DESC"
	}

	offset := (page - 1) * pageSize
	if err := query.Order(orderClause).Offset(offset).Limit(pageSize).Find(&newspapers).Error; err != nil {
		utils.InternalServerError(c, "获取报刊列表失败")
		return
	}

	utils.Success(c, gin.H{
		"list":      newspapers,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetNewspaperAdminList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")
	categoryID := c.Query("category_id")
	status := c.Query("status")

	var newspapers []models.Newspaper
	var total int64

	query := database.DB.Model(&models.Newspaper{}).Preload("Category")

	if keyword != "" {
		query = query.Where("title LIKE ?", "%"+keyword+"%")
	}

	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	if err := query.Order("id DESC").Offset(offset).Limit(pageSize).Find(&newspapers).Error; err != nil {
		utils.InternalServerError(c, "获取报刊列表失败")
		return
	}

	utils.Success(c, gin.H{
		"list":      newspapers,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetNewspaperDetail(c *gin.Context) {
	id := c.Param("id")

	var newspaper models.Newspaper
	if err := database.DB.Preload("Category").First(&newspaper, id).Error; err != nil {
		utils.NotFound(c, "报刊不存在")
		return
	}

	utils.Success(c, newspaper)
}

func GetSalesRanking(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	var newspapers []models.Newspaper
	if err := database.DB.Preload("Category").Where("status = 1").
		Order("sales DESC").Limit(limit).Find(&newspapers).Error; err != nil {
		utils.InternalServerError(c, "获取销量排行失败")
		return
	}

	utils.Success(c, newspapers)
}

func CreateNewspaper(c *gin.Context) {
	var req NewspaperRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	newspaper := models.Newspaper{
		Title:        req.Title,
		CategoryID:   req.CategoryID,
		Description:  req.Description,
		Image:        req.Image,
		Price:        req.Price,
		MonthPrice:   req.MonthPrice,
		QuarterPrice: req.QuarterPrice,
		YearPrice:    req.YearPrice,
		Sales:        req.Sales,
		Status:       1,
	}

	if newspaper.MonthPrice == 0 {
		newspaper.MonthPrice = newspaper.Price
	}
	if newspaper.QuarterPrice == 0 {
		newspaper.QuarterPrice = newspaper.Price * 3
	}
	if newspaper.YearPrice == 0 {
		newspaper.YearPrice = newspaper.Price * 12
	}

	if err := database.DB.Create(&newspaper).Error; err != nil {
		utils.InternalServerError(c, "创建报刊失败")
		return
	}

	utils.SuccessWithMessage(c, "创建成功", newspaper)
}

func UpdateNewspaper(c *gin.Context) {
	id := c.Param("id")

	var req NewspaperRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	var newspaper models.Newspaper
	if err := database.DB.First(&newspaper, id).Error; err != nil {
		utils.NotFound(c, "报刊不存在")
		return
	}

	updates := map[string]interface{}{
		"title":         req.Title,
		"category_id":   req.CategoryID,
		"description":   req.Description,
		"image":         req.Image,
		"price":         req.Price,
		"month_price":   req.MonthPrice,
		"quarter_price": req.QuarterPrice,
		"year_price":    req.YearPrice,
	}

	if req.Status != 0 {
		updates["status"] = req.Status
	}

	if err := database.DB.Model(&newspaper).Updates(updates).Error; err != nil {
		utils.InternalServerError(c, "更新报刊失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", newspaper)
}

func DeleteNewspaper(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Delete(&models.Newspaper{}, id).Error; err != nil {
		utils.InternalServerError(c, "删除报刊失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}
