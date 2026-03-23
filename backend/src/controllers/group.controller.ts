import { Request, Response } from 'express';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { prisma } from '../config/database.js';

function generateInviteCode(): string {
  return randomBytes(3).toString('hex').toUpperCase();
}

function extractId(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param ?? '';
}

const createGroupSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

const joinGroupSchema = z.object({
  inviteCode: z.string().min(1).trim().toUpperCase(),
});

// POST /api/groups — create a group
export async function createGroup(req: Request, res: Response): Promise<void> {
  const result = createGroupSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.errors });
    return;
  }

  const { name } = result.data;
  const userId = req.user!.userId;

  let inviteCode = generateInviteCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.group.findUnique({ where: { inviteCode } });
    if (!existing) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  const group = await prisma.group.create({
    data: {
      name,
      inviteCode,
      ownerId: userId,
      members: { create: { userId } },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: { select: { recipes: true } },
    },
  });

  res.status(201).json({ group });
}

// GET /api/groups/mine — list groups the user belongs to
export async function getMyGroups(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { recipes: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  const groups = memberships.map((m) => ({
    ...m.group,
    joinedAt: m.joinedAt,
  }));

  res.json({ groups });
}

// GET /api/groups/:id — get a single group (must be a member)
export async function getGroup(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const id = extractId(req.params['id']);

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: id } },
  });

  if (!membership) {
    res.status(403).json({ error: 'You are not a member of this group' });
    return;
  }

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: 'asc' },
      },
      _count: { select: { recipes: true } },
    },
  });

  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  res.json({ group });
}

// POST /api/groups/join — join by invite code
export async function joinGroup(req: Request, res: Response): Promise<void> {
  const result = joinGroupSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invite code is required' });
    return;
  }

  const { inviteCode } = result.data;
  const userId = req.user!.userId;

  const group = await prisma.group.findUnique({ where: { inviteCode } });
  if (!group) {
    res.status(404).json({ error: 'Invalid invite code' });
    return;
  }

  const existing = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: group.id } },
  });
  if (existing) {
    res.status(409).json({ error: 'You are already a member of this group' });
    return;
  }

  await prisma.groupMember.create({ data: { userId, groupId: group.id } });

  const updated = await prisma.group.findUnique({
    where: { id: group.id },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: { select: { recipes: true } },
    },
  });

  res.status(201).json({ group: updated });
}

// DELETE /api/groups/:id/leave — leave a group
export async function leaveGroup(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const id = extractId(req.params['id']);

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  if (group.ownerId === userId) {
    res.status(400).json({ error: 'The group owner cannot leave. Delete the group instead.' });
    return;
  }

  await prisma.groupMember.deleteMany({ where: { userId, groupId: id } });
  res.status(204).send();
}

// DELETE /api/groups/:id — delete a group (owner only)
export async function deleteGroup(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const id = extractId(req.params['id']);

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  if (group.ownerId !== userId) {
    res.status(403).json({ error: 'Only the group owner can delete it' });
    return;
  }

  await prisma.group.delete({ where: { id } });
  res.status(204).send();
}
