import type { Team } from "@webiny/api-security/types.js";

export interface IListIdentityTeamsGateway {
    execute: () => Promise<Team[]>;
}
