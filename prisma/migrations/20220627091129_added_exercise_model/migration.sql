-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('strength', 'conditioning', 'saq', 'mobility', 'plyometrics');

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "equipment" TEXT,
    "compound" BOOLEAN NOT NULL,
    "muscleGroups" JSONB,
    "movementPattern" TEXT,
    "synonyms" TEXT[],
    "comment" TEXT,
    "userId" TEXT,
    "parentExerciseId" TEXT,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_id_key" ON "Exercise"("id");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_parentExerciseId_fkey" FOREIGN KEY ("parentExerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
