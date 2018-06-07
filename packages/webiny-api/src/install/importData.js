import {
    admin,
    policySecurityFullAccess,
    policySuperAdmin,
    groupDefault,
    policySecurityUserAuthentication
} from "./entities";

export default async () => {
    await groupDefault();
    await policySecurityFullAccess();
    await policySuperAdmin();
    await policySecurityUserAuthentication();
    await admin();
};
