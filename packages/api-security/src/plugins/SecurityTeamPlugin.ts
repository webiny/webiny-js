import { Plugin } from "@webiny/plugins";
import { SecurityTeam } from "~/types";

export interface SecurityTeamPluginParams {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    roles?: string[];
    tenant?: string;
}

export class SecurityTeamPlugin extends Plugin {
    public static override readonly type: string = "security-team";
    public readonly securityTeam: SecurityTeam;

    constructor(params: SecurityTeamPluginParams) {
        super();

        const { id, name, slug = id, description = "", roles = [], tenant = null } = params;

        this.securityTeam = {
            id,
            name,
            slug,
            description,
            groups: roles,
            tenant,

            // Internal properties.
            system: false,
            plugin: true,
            createdBy: null,
            createdOn: null,
            webinyVersion: null
        };
    }
}

export const createSecurityTeamPlugin = (
    securityTeam: SecurityTeamPluginParams
): SecurityTeamPlugin => {
    return new SecurityTeamPlugin(securityTeam);
};
