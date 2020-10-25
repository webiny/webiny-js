import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";

export const PK_LOCALE = "L";
export const PK_DEFAULT_LOCALE = "L#D";

export const keys = [
    { primary: true, unique: true, name: "primary", fields: [{ name: "PK" }, { name: "SK" }] }
];

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
                const [[locale]] = await db.read<Locale>({
                    keys,
                    query: { PK: PK_LOCALE, SK: code },
                    limit: 1
                });

                return locale;
            },
            async getDefault() {
                const [[locale]] = await db.read({
                    keys,
                    query: { PK: PK_DEFAULT_LOCALE, SK: "default" },
                    limit: 1
                });

                return locale;
            },
            async list(args) {
                const [locales] = await db.read({
                    keys,
                    query: { PK: PK_LOCALE, SK: { $gt: " " } },
                    ...args
                });

                return locales;
            },
            create(data) {
                return db.create({
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
                    keys,
                    query: { PK: PK_LOCALE, SK: code },
                    data: {
                        PK: PK_LOCALE,
                        SK: code,
                        default: data.default
                    }
                });
            },
            delete(code: string) {
                return db.delete({
                    keys,
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
                        keys,
                        query: { PK: PK_DEFAULT_LOCALE, SK: "default" },
                        data: {
                            PK: PK_DEFAULT_LOCALE,
                            SK: "default",
                            code
                        }
                    });

                    batch.update({
                        keys,
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
                        keys,
                        data: {
                            PK: PK_DEFAULT_LOCALE,
                            SK: "default",
                            code
                        }
                    });
                }

                batch.update({
                    keys,
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
