// PersonalSpace — canonical ownership boundary (personal-only phase).
// No Organization/members/teams/RBAC/multi-tenancy.

export type PersonalSpaceId = string;
export type PersonalOwnerId = string;

export interface PersonalSpace {
  readonly id: PersonalSpaceId;
  readonly owner: PersonalOwnerId;
  readonly createdAt: string;
  readonly version: number;
}

export function createPersonalSpace(owner: PersonalOwnerId): PersonalSpace {
  return {
    id: `ps-${owner}`,
    owner,
    createdAt: new Date().toISOString(),
    version: 1,
  };
}