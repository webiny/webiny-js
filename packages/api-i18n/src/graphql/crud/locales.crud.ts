import { DbContext } from "@webiny/handler-db/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { Context } from "@webiny/handler/types";
import getPKPrefix from "./utils/getPKPrefix";
import dbArgs from "./utils/dbArgs";
import { I18NContext, I18NLocale } from "~/types";

export default (context: Context<DbContext, TenancyContext, I18NContext>) => {
    const { db, security } = context;

    const PK_LOCALE = () => `${getPKPrefix(context)}L`;
    const PK_DEFAULT_LOCALE = () => `${PK_LOCALE()}#D`;

    return {
        async getByCode(code: string) {
            const [[locale]] = await db.read<I18NLocale>({
                ...dbArgs,
                query: { PK: PK_LOCALE(), SK: code },
                limit: 1
            });

            return locale;
        },
        async getDefault() {
            const [[locale]] = await db.read<I18NLocale>({
                ...dbArgs,
                query: { PK: PK_DEFAULT_LOCALE(), SK: "default" },
                limit: 1
            });

            return locale;
        },
        async list(args) {
            const [locales] = await db.read<I18NLocale>({
                ...dbArgs,
                query: { PK: PK_LOCALE(), SK: { $gt: " " } },
                ...args
            });

            return locales;
        },
        create(data) {
            const identity = security.getIdentity();

            return db.create({
                ...dbArgs,
                data: {
                    PK: PK_LOCALE(),
                    SK: data.code,
                    code: data.code,
                    default: data.default,
                    createdOn: new Date().toISOString(),
                    createdBy: {
                        id: identity.id,
                        displayName: identity.displayName,
                        type: identity.type
                    }
                }
            });
        },
        update(code, data) {
            return db.update({
                ...dbArgs,
                query: { PK: PK_LOCALE(), SK: code },
                data: {
                    default: data.default
                }
            });
        },
        delete(code: string) {
            return db.delete({
                ...dbArgs,
                query: { PK: PK_LOCALE(), SK: code },
                limit: 1
            });
        },
        async updateDefault(code) {
            const defaultLocale = await this.getDefault();
            const currentLocale = await this.getByCode(code);
            const batch = db.batch();

            if (defaultLocale) {
                // No need to update anything if the defaultLocale is already set.
                if (defaultLocale.code === code) {
                    return;
                }

                const defaultLocaleData = await this.getByCode(defaultLocale.code);
                batch.update({
                    ...dbArgs,
                    query: { PK: PK_DEFAULT_LOCALE(), SK: "default" },
                    data: {
                        PK: PK_DEFAULT_LOCALE(),
                        SK: "default",
                        code
                    }
                });

                batch.update({
                    ...dbArgs,
                    query: { PK: PK_LOCALE(), SK: defaultLocale.code },
                    data: {
                        ...defaultLocaleData,
                        PK: PK_LOCALE(),
                        SK: defaultLocale.code,
                        code: defaultLocale.code,
                        default: false
                    }
                });
            } else {
                await db.create({
                    ...dbArgs,
                    data: {
                        PK: PK_DEFAULT_LOCALE(),
                        SK: "default",
                        code
                    }
                });
            }

            batch.update({
                ...dbArgs,
                query: { PK: PK_LOCALE(), SK: code },
                data: {
                    ...currentLocale,
                    PK: PK_LOCALE(),
                    SK: code,
                    code: code,
                    default: true
                }
            });

            return await batch.execute();
        }
    };
};
