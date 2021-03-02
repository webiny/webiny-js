import { DbContext } from "@webiny/handler-db/types";
import { TenancyContext, SystemCRUD } from "../types";
import dbArgs from "./dbArgs";

export default (context: DbContext & TenancyContext): SystemCRUD => {
    const { db, security } = context;

    const keys = () => ({ PK: `T#${security.getTenant().id}#SYSTEM`, SK: "SECURITY" });

    return {
        async getVersion() {
            const rootTenant = await security.tenants.getRootTenant();
            if (!rootTenant) {
                return null;
            }
            
            const [[system]] = await db.read({
                ...dbArgs,
                query: keys()
            });

            // Backwards compatibility check
            if (!system) {
                const rootTenant = await security.tenants.getRootTenant();
                // If the tenant exists, it means this system was installed before versioning was introduced.
                // 5.0.0-beta.4 is the last version before versioning was introduced.
                return rootTenant ? "5.0.0-beta.4" : null;
            }

            return system.version;
        },
        async setVersion(version: string) {
            const [[system]] = await db.read({
                ...dbArgs,
                query: keys()
            });

            if (system) {
                await db.update({
                    ...dbArgs,
                    query: keys(),
                    data: {
                        version
                    }
                });
            } else {
                await db.create({
                    ...dbArgs,
                    data: {
                        ...keys(),
                        version
                    }
                });
            }
        }
    };
};
