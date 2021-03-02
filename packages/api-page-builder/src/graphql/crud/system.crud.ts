import defaults from "./utils/defaults";
import { PbContext } from "../../types";

export default {
    type: "context",
    apply(context: PbContext) {
        const { security, db } = context;
        const keys = () => ({ PK: `T#${security.getTenant().id}#SYSTEM`, SK: "PB" });

        context.pageBuilder = {
            ...context.pageBuilder,
            system: {
                async getVersion() {
                    const [[system]] = await db.read({
                        ...defaults.db,
                        query: keys()
                    });

                    // Backwards compatibility check
                    if (!system) {
                        // Check for the old "install" item; it means this system was installed before versioning was introduced.
                        // 5.0.0-beta.4 is the last version before versioning was introduced.
                        const [[oldInstall]] = await db.read({
                            ...defaults.db,
                            query: {
                                PK: `T#${security.getTenant().id}#PB#SETTINGS`,
                                SK: "install"
                            }
                        });

                        return oldInstall ? "5.0.0-beta.4" : null;
                    }

                    return system.version;
                },
                async setVersion(version: string) {
                    const [[system]] = await db.read({
                        ...defaults.db,
                        query: keys()
                    });

                    if (system) {
                        await db.update({
                            ...defaults.db,
                            query: keys(),
                            data: {
                                version
                            }
                        });
                    } else {
                        await db.create({
                            ...defaults.db,
                            data: {
                                ...keys(),
                                version
                            }
                        });
                    }
                }
            }
        };
    }
};
