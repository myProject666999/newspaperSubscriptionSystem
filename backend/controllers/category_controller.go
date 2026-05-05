package controllers

import (
	"newspaperSubscriptionSystem/database"
	"newspaperSubscriptionSystem/models"
	"newspaperSubscriptionSystem/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CategoryRequest struct {
	Name   string `json:"name" binding:"required"`
	Sort   int    `json:"sort"`
	Status int    `json:"status"`
}

func GetCategoryList(c *gin.Context) {
	var categories []models.Category

	query := database.DB.Model(&models.Category{})

	if c.Query("status") != "" {
		query = query.Where("status = ?", c.Query("status"))
	}

	if err := query.Order("sort ASC, id ASC").Find(&categories).Error; err != nil {
		utils.InternalServerError(c, "获取分类列表失败")
		return
	}

	utils.Success(c, categories)
}

func GetCategoryPaginated(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")

	var categories []models.Category
	var total int64

	query := database.DB.Model(&models.Category{})

	if keyword != "" {
		query = query.Where("name LIKE ?", "%"+keyword+"%")
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	if err := query.Order("sort ASC, id DESC").Offset(offset).Limit(pageSize).Find(&categories).Error; err != nil {
		utils.InternalServerError(c, "获取分类列表失败")
		return
	}

	utils.Success(c, gin.H{
		"list":      categories,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetCategoryDetail(c *gin.Context) {
	id := c.Param("id")

	var category models.Category
	if err := database.DB.First(&category, id).Error; err != nil {
		utils.NotFound(c, "分类不存在")
		return
	}

	utils.Success(c, category)
}

func CreateCategory(c *gin.Context) {
	var req CategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	var existing models.Category
	if database.DB.Where("name = ?", req.Name).First(&existing).Error == nil {
		utils.BadRequest(c, "分类名称已存在")
		return
	}

	category := models.Category{
		Name:   req.Name,
		Sort:   req.Sort,
		Status: 1,
	}

	if err := database.DB.Create(&category).Error; err != nil {
		utils.InternalServerError(c, "创建分类失败")
		return
	}

	utils.SuccessWithMessage(c, "创建成功", category)
}

func UpdateCategory(c *gin.Context) {
	id := c.Param("id")

	var req CategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	var category models.Category
	if err := database.DB.First(&category, id).Error; err != nil {
		utils.NotFound(c, "分类不存在")
		return
	}

	var existing models.Category
	if database.DB.Where("name = ? AND id != ?", req.Name, id).First(&existing).Error == nil {
		utils.BadRequest(c, "分类名称已存在")
		return
	}

	category.Name = req.Name
	category.Sort = req.Sort
	if req.Status != 0 {
		category.Status = req.Status
	}

	if err := database.DB.Save(&category).Error; err != nil {
		utils.InternalServerError(c, "更新分类失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", category)
}

func DeleteCategory(c *gin.Context) {
	id := c.Param("id")

	var count int
	database.DB.Model(&models.Newspaper{}).Where("category_id = ?", id).Count(&count)
	if count > 0 {
		utils.BadRequest(c, "该分类下还有报刊，无法删除")
		return
	}

	if err := database.DB.Delete(&models.Category{}, id).Error; err != nil {
		utils.InternalServerError(c, "删除分类失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}
