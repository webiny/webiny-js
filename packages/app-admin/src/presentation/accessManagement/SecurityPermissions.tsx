import React, { useMemo } from "react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { useWcp } from "~/presentation/wcp/useWcp.js";
import type { EntityDefinition } from "~/permissions/types.js";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/security.svg";

const { Security } = AdminConfig;

export const SecurityPermissions = () => {
    const wcp = useWcp();
    const teams = wcp.canUseTeams();

    const schema = useMemo(() => {
        const entities: EntityDefinition[] = [
            {
                id: "apiKey",
                title: "API Keys",
                permission: "security.apiKey",
                scopes: ["full"]
            },
            {
                id: "group",
                title: "Roles",
                permission: "security.group",
                scopes: ["full"]
            }
        ];

        if (teams) {
            entities.push({
                id: "team",
                title: "Teams",
                permission: "security.team",
                scopes: ["full"]
            });
        }

        return {
            prefix: "security",
            fullAccess: true,
            entities
        };
    }, [teams]);

    return (
        <AdminConfig>
            <Security.Permissions
                name="security"
                title="Security"
                description="Manage Security permissions."
                icon={<PermissionsIcon />}
                schema={schema}
            />
        </AdminConfig>
    );
};
