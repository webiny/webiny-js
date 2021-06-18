import { DbContext } from "@webiny/handler-db/types";
import dbArgs from "./utils/dbArgs";
import { I18NContext, SystemCRUD } from "~/types";

export default (context: DbContext & I18NContext): SystemCRUD => {
    const { db, i18n, tenancy } = context;

    const keys = () => ({ PK: `T#${tenancy.getCurrentTenant().id}#SYSTEM`, SK: "I18N" });

    return {
        async getVersion() {
            const [[system]] = await db.read({
                ...dbArgs,
                query: keys()
            });

            // Backwards compatibility check
            if (!system) {
                const defaultLocale = await i18n.locales.getDefault();
                // If defaultLocale exists, it means this system was installed before versioning was introduced.
                // 5.0.0-beta.4 is the last version before versioning was introduced.
                return defaultLocale ? "5.0.0-beta.4" : null;
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
        },
        async install(args) {
            const { i18n } = context;
            await i18n.locales.create({ code: args.code, default: true });
            await i18n.locales.updateDefault(args.code);
            await i18n.system.setVersion(context.WEBINY_VERSION);
        }
    };
};
