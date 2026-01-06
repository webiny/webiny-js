import type { Team } from "~/types/security.js";

export type { Team };

export interface CreateTeamInput {
    name: string;
    slug: string;
    description: string;
    roles: string[];
    system?: boolean;
}

export interface UpdateTeamInput {
    name?: string;
    description?: string;
    roles?: string[];
}

export type GetTeamInput =
    | {
          id: string;
          slug?: never;
      }
    | {
          slug: string;
          id?: never;
      };

export interface ListTeamsInput {
    where?: {
        id_in?: string[];
        slug_in?: string[];
    };
    sort?: string[];
}
