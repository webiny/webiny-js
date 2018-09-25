// @flow
import {
    admin,
    policySecurityFullAccess,
    policySuperAdmin,
    groupDefault,
    policySecurityUserAuthentication,
    policyFilesOwnersAccess
} from "./entities";

export default async () => {
    await groupDefault();
    await policySecurityFullAccess();
    await policySuperAdmin();
    await policySecurityUserAuthentication();
    await policyFilesOwnersAccess();
    await admin();
};
