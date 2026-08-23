export type Role = "admin" | "member";
export type Membership = { userId: string; teamId: string; role: Role };
export const membershipKey = (teamId: string, userId: string) => `${teamId}:${userId}`;
