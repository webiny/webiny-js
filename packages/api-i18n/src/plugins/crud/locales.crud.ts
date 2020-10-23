import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";

export const PK_LOCALE = "L";
export const PK_DEFAULT_LOCALE = "L#D";

export const dbDefaults = {
    table: "I18N",
    keys: [
        { primary: true, unique: true, name: "primary", fields: [{ name: "PK" }, { name: "SK" }] }
    ]
};

export type Locale = {
    code: string;
    default: boolean;
};

export default {
    type: "context",
    apply(context) {
        const { db } = context;
        context.locales = {
            async getByCode(code: string) {
                const [[locale]] = await db.read({
                    ...dbDefaults,
                    query: { PK: PK_LOCALE, SK: code },
                    limit: 1
                });

                return locale;
            },
            async getDefault() {
                const [[locale]] = await db.read({
                    ...dbDefaults,
                    query: { PK: PK_DEFAULT_LOCALE, SK: "default" },
                    limit: 1
                });

                return locale;
            },
            async list() {
                const [locales] = await db.read({
                    ...dbDefaults,
                    query: { PK: PK_LOCALE, SK: { $gt: " " } }
                });

                return locales;
            },
            create(data) {
                return db.create({
                    ...dbDefaults,
                    data: {
                        PK: PK_LOCALE,
                        SK: data.code,
                        code: data.code,
                        default: data.default
                    }
                });
            },
            update(code, data) {
                return db.update({
                    ...dbDefaults,
                    data: {
                        PK: PK_LOCALE,
                        SK: code,
                        default: data.default
                    }
                });
            },
            delete(code: string) {
                return db.delete({
                    ...dbDefaults,
                    query: { PK: PK_LOCALE, SK: code },
                    limit: 1
                });
            },

            async updateDefault(code) {
                const defaultLocale = await this.getDefault();
                const batch = db.batch();

                if (defaultLocale) {
                    // No need to update anything if the defaultLocale is already set.
                    if (defaultLocale.code === code) {
                        return;
                    }

                    batch.update({
                        ...dbDefaults,
                        query: { PK: PK_DEFAULT_LOCALE, SK: "default" },
                        data: {
                            PK: PK_DEFAULT_LOCALE,
                            SK: "default",
                            code
                        }
                    });

                    batch.update({
                        ...dbDefaults,
                        query: { PK: PK_LOCALE, SK: defaultLocale.code },
                        data: {
                            PK: PK_LOCALE,
                            SK: defaultLocale.code,
                            code: defaultLocale.code,
                            default: false
                        }
                    });
                } else {
                    await db.create({
                        ...dbDefaults,
                        data: {
                            PK: PK_DEFAULT_LOCALE,
                            SK: "default",
                            code
                        }
                    });
                }

                batch.update({
                    ...dbDefaults,
                    query: { PK: PK_LOCALE, SK: code },
                    data: {
                        PK: PK_LOCALE,
                        SK: code,
                        code: code,
                        default: true
                    }
                });

                return await batch.execute();
            }
        };
    }
} as HandlerContextPlugin<HandlerContextDb>;
