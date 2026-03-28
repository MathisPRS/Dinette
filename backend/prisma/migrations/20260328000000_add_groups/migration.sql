-- CreateTable: Group
CREATE TABLE "Group" (
    "id"         TEXT         NOT NULL,
    "name"       TEXT         NOT NULL,
    "inviteCode" TEXT         NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId"    TEXT         NOT NULL,
    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GroupMember
CREATE TABLE "GroupMember" (
    "userId"   TEXT         NOT NULL,
    "groupId"  TEXT         NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("userId", "groupId")
);

-- Add groupId column to Recipe
ALTER TABLE "Recipe" ADD COLUMN "groupId" TEXT;

-- Unique constraint on inviteCode
CREATE UNIQUE INDEX "Group_inviteCode_key" ON "Group"("inviteCode");

-- Foreign keys
ALTER TABLE "Group"
    ADD CONSTRAINT "Group_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "GroupMember"
    ADD CONSTRAINT "GroupMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "GroupMember"
    ADD CONSTRAINT "GroupMember_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "Recipe"
    ADD CONSTRAINT "Recipe_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON UPDATE CASCADE ON DELETE SET NULL;
