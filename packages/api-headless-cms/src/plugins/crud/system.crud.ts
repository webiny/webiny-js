import * as utils from "../../utils";
import { CmsContext } from "../../types";

export default {
    type: "context",
    apply(context: CmsContext) {
        const { security, db } = context;
        const keys = () => ({ PK: `T#${security.getTenant().id}#SYSTEM`, SK: "CMS" });

        context.cms = {
            ...context.cms,
            system: {
                async getVersion() {
                    const [[system]] = await db.read({
                        ...utils.defaults.db(),
                        query: keys()
                    });

                    // Backwards compatibility check
                    if (!system) {
                        // If settings already exist, it means this system was installed before versioning was introduced.
                        // 5.0.0-beta.4 is the last version before versioning was introduced.
                        const settings = await context.cms.settings.noAuth().get();
                        
                        return settings ? "5.0.0-beta.4" : null;
                    }

                    return system.version;
                },
                async setVersion(version: string) {
                    const [[system]] = await db.read({
                        ...utils.defaults.db(),
                        query: keys()
                    });

                    if (system) {
                        await db.update({
                            ...utils.defaults.db(),
                            query: keys(),
                            data: {
                                version
                            }
                        });
                    } else {
                        await db.create({
                            ...utils.defaults.db(),
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
