/**
 * Generate a random 6-digit room code
 * Format: XXXXXX (e.g., 123456, 789012)
 */
export function generateRoomCode(): string {
  const min = 100000;
  const max = 999999;
  const code = Math.floor(Math.random() * (max - min + 1)) + min;
  return code.toString();
}

/**
 * Generate a unique room ID
 * Format: room_[timestamp]_[random] (e.g., room_1234567890_abc123)
 */
export function generateRoomId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `room_${timestamp}_${random}`;
}