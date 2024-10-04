import { SecurityRolePlugin } from "@webiny/api-security/plugins/SecurityRolePlugin";
import { SecurityPermission } from "@webiny/api-security/types";

interface CreateTestTeamParams {
    id: string;
    name: string;
    permissions?: SecurityPermission[];
}

export const createTestRole = (params: CreateTestTeamParams) => {
    return new SecurityRolePlugin(params).securityRole;
};
