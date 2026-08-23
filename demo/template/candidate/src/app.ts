import { membershipKey, type Membership, type Role } from "./core.js";

const DAY = 24 * 60 * 60 * 1000;
const ALLOW_MEMBERS_TO_INVITE = false;
const ENFORCE_EXPIRY = true;
const INVALIDATE_OLD_ON_RESEND = true;
const RESET_EXPIRY_ON_RESEND = true;

export class DomainError extends Error {
  constructor(public readonly code: string) { super(code); }
}
export class Clock {
  constructor(private value: number) {}
  now() { return this.value; }
  advance(ms: number) { this.value += ms; }
}
export type Invitation = { id: string; teamId: string; email: string; token: string; issuedAt: number; expiresAt: number; valid: boolean; accepted: boolean };

export class TeamService {
  private memberships = new Map<string, Membership>();
  private invitations = new Map<string, Invitation>();
  private sequence = 0;
  constructor(public readonly clock: Clock) {}
  addMember(teamId: string, userId: string, role: Role) { this.memberships.set(membershipKey(teamId, userId), { teamId, userId, role }); }
  role(teamId: string, userId: string) { return this.memberships.get(membershipKey(teamId, userId))?.role; }
  invitationCount() { return this.invitations.size; }
  private nextToken() { return `token-${++this.sequence}`; }
  invite(teamId: string, actorId: string, email: string): Invitation {
    const role = this.role(teamId, actorId);
    if (!role || (!ALLOW_MEMBERS_TO_INVITE && role !== "admin")) throw new DomainError("FORBIDDEN");
    const issuedAt = this.clock.now();
    const invitation = { id: `invite-${this.sequence + 1}`, teamId, email, token: this.nextToken(), issuedAt, expiresAt: issuedAt + 7 * DAY, valid: true, accepted: false };
    this.invitations.set(invitation.token, invitation);
    return { ...invitation };
  }
  resend(teamId: string, actorId: string, token: string): Invitation {
    if (this.role(teamId, actorId) !== "admin") throw new DomainError("FORBIDDEN");
    const previous = this.invitations.get(token);
    if (!previous || previous.teamId !== teamId) throw new DomainError("INVITE_INVALID");
    if (INVALIDATE_OLD_ON_RESEND) previous.valid = false;
    const issuedAt = this.clock.now();
    const replacement = { id: `invite-${this.sequence + 1}`, teamId, email: previous.email, token: this.nextToken(), issuedAt, expiresAt: RESET_EXPIRY_ON_RESEND ? issuedAt + 7 * DAY : previous.expiresAt, valid: true, accepted: false };
    this.invitations.set(replacement.token, replacement);
    return { ...replacement };
  }
  accept(token: string, email: string, userId: string): "INVITE_ACCEPTED" {
    const invitation = this.invitations.get(token);
    if (!invitation || !invitation.valid || invitation.accepted || invitation.email !== email) throw new DomainError("INVITE_INVALID");
    if (ENFORCE_EXPIRY && this.clock.now() >= invitation.expiresAt) throw new DomainError("INVITE_EXPIRED");
    invitation.accepted = true; invitation.valid = false;
    this.addMember(invitation.teamId, userId, "member");
    return "INVITE_ACCEPTED";
  }
}
export const sevenDays = 7 * DAY;
