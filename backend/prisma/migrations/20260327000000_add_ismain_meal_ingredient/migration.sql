-- AlterTable: add isMain column to MealIngredient
ALTER TABLE "MealIngredient" ADD COLUMN "isMain" BOOLEAN NOT NULL DEFAULT false;
