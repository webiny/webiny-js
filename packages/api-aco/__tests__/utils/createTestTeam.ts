import { SecurityTeamPlugin } from "@webiny/api-security/plugins/SecurityTeamPlugin";

interface CreateTestTeamParams {
    id: string;
    name: string;
    roles?: string[];
}

export const createTestTeam = (params: CreateTestTeamParams) => {
    return new SecurityTeamPlugin(params).securityTeam;
};
