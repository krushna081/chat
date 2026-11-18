import { describe, expect, it } from 'vitest';
import { isParticipant, serializeRoom } from '../utils/roomAccess.js';

const room = {
  _id: '507f1f77bcf86cd799439011',
  roomId: '0123456789abcdef',
  roomName: 'Test room',
  roomPicture: null,
  isPrivate: true,
  password: 'hashed-room-password',
  roomKey: 'c'.repeat(64),
  participants: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
  creator: '507f1f77bcf86cd799439012',
  messageExpiry: '24h',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  lastActivity: new Date('2026-01-01T00:00:00.000Z'),
};

describe('room serialization and access helpers', () => {
  it('recognizes members by ObjectId string', () => {
    expect(isParticipant(room, '507f1f77bcf86cd799439012')).toBe(true);
    expect(isParticipant(room, '507f1f77bcf86cd799439099')).toBe(false);
  });

  it('never serializes password hashes or plaintext participant lists', () => {
    const serialized = serializeRoom(room);
    expect(serialized).not.toHaveProperty('password');
    expect(serialized).not.toHaveProperty('participants');
    expect(serialized).not.toHaveProperty('roomKey');
    expect(serialized.participantCount).toBe(2);
  });

  it('includes the room key only for an explicit key-bearing response', () => {
    expect(serializeRoom(room, { includeKey: true }).roomKey).toBe(room.roomKey);
  });
});
