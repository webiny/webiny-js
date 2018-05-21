import { admin, groupDefault, groupSecurity, securitySettings } from "./entities";

export default async () => {
    await groupDefault();
    await groupSecurity();
    await securitySettings();
    await admin();
};
