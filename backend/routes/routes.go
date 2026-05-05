package routes

import (
	"newspaperSubscriptionSystem/controllers"
	"newspaperSubscriptionSystem/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")
	{
		api.POST("/login", controllers.Login)
		api.POST("/register", controllers.Register)

		api.GET("/categories", controllers.GetCategoryList)
		api.GET("/newspapers", controllers.GetNewspaperList)
		api.GET("/newspapers/:id", controllers.GetNewspaperDetail)
		api.GET("/newspapers/sales/ranking", controllers.GetSalesRanking)
		api.GET("/reviews", controllers.GetReviewList)

		user := api.Group("/user")
		user.Use(middleware.JWTAuth())
		{
			user.GET("/info", controllers.GetUserInfo)
			user.PUT("/info", controllers.UpdateUserInfo)
			user.POST("/change-password", controllers.ChangePassword)

			cart := user.Group("")
			cart.Use(middleware.UserAuth())
			{
				cart.GET("/cart", controllers.GetCartList)
				cart.POST("/cart", controllers.AddToCart)
				cart.PUT("/cart/:id", controllers.UpdateCart)
				cart.DELETE("/cart/:id", controllers.RemoveFromCart)
				cart.DELETE("/cart", controllers.ClearCart)

				cart.POST("/orders", controllers.CreateOrder)
				cart.GET("/orders", controllers.GetOrderList)
				cart.GET("/orders/:id", controllers.GetOrderDetail)
				cart.PUT("/orders/:id/cancel", controllers.CancelOrder)
				cart.PUT("/orders/:id/complete", controllers.CompleteOrder)

				cart.POST("/reviews", controllers.CreateReview)
			}
		}

		admin := api.Group("/admin")
		admin.Use(middleware.JWTAuth(), middleware.AdminAuth())
		{
			admin.GET("/users", controllers.GetUserList)
			admin.GET("/users/:id", controllers.GetUserDetail)
			admin.PUT("/users/:id/:action", controllers.UpdateUserStatus)
			admin.DELETE("/users/:id", controllers.DeleteUser)

			admin.GET("/categories", controllers.GetCategoryPaginated)
			admin.GET("/categories/:id", controllers.GetCategoryDetail)
			admin.POST("/categories", controllers.CreateCategory)
			admin.PUT("/categories/:id", controllers.UpdateCategory)
			admin.DELETE("/categories/:id", controllers.DeleteCategory)

			admin.GET("/newspapers", controllers.GetNewspaperAdminList)
			admin.GET("/newspapers/:id", controllers.GetNewspaperDetail)
			admin.POST("/newspapers", controllers.CreateNewspaper)
			admin.PUT("/newspapers/:id", controllers.UpdateNewspaper)
			admin.DELETE("/newspapers/:id", controllers.DeleteNewspaper)

			admin.GET("/orders", controllers.GetAdminOrderList)
			admin.GET("/orders/:id", controllers.GetOrderDetail)
			admin.PUT("/orders/:id/ship", controllers.ShipOrder)
			admin.DELETE("/orders/:id", controllers.DeleteOrder)

			admin.GET("/reviews", controllers.GetAdminReviewList)
			admin.DELETE("/reviews/:id", controllers.DeleteReview)

			admin.GET("/stats/sales", controllers.GetSalesStats)
		}
	}

	return r
}
