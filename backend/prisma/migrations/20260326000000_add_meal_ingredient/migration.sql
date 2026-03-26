-- CreateTable
CREATE TABLE "MealIngredient" (
    "id" SERIAL NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,

    CONSTRAINT "MealIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MealIngredient_nameEn_key" ON "MealIngredient"("nameEn");
