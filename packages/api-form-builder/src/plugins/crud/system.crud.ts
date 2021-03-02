import defaults from "./defaults";
import { FormBuilderContext } from "../../types";

export default {
    type: "context",
    apply(context: FormBuilderContext) {
        const { security } = context;
        const keys = () => ({ PK: `T#${security.getTenant().id}#SYSTEM`, SK: "FB" });

        context.formBuilder = {
            ...context.formBuilder,
            system: {
                async getVersion() {
                    const { db, formBuilder } = context;

                    const [[system]] = await db.read({
                        ...defaults.db,
                        query: keys()
                    });

                    // Backwards compatibility check
                    if (!system) {
                        // If settings exist, it means this system was installed before versioning was introduced.
                        // 5.0.0-beta.4 is the last version before versioning was introduced.
                        const settings = await formBuilder.settings.getSettings({
                            auth: false
                        });

                        return settings ? "5.0.0-beta.4" : null;
                    }

                    return system.version;
                },
                async setVersion(version: string) {
                    const { db } = context;

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
