import type { SecurityPermission } from "~/types/security.js";
import { filterOutCustomWbyAppsPermissions } from "./filterOutCustomWbyAppsPermissions.js";

interface ApplyAaclLogicParams {
    aaclEnabled: boolean;
    teamsEnabled: boolean;
}

/**
 * With AACL, the permissions get an `aacl` entry that says whether teams are enabled.
 * Without it, only full access to Webiny's own apps is kept.
 */
export const applyAaclLogic = (
    permissions: SecurityPermission[],
    params: ApplyAaclLogicParams
): SecurityPermission[] => {
    if (!params.aaclEnabled) {
        return filterOutCustomWbyAppsPermissions(permissions);
    }

    const aaclPermission: SecurityPermission = {
        name: "aacl",
        teams: params.teamsEnabled
    };

    return [...permissions, aaclPermission];
};
