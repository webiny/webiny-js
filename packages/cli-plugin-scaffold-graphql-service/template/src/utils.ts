import WebinyError from "@webiny/error";
import { ApplicationUtils } from "./types";

export const utils: ApplicationUtils = {
    /**
     * DynamoDB table.
     */
    db: () => ({
        table: process.env.DB_TABLE_TARGET,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [
                    {
                        name: "PK"
                    },
                    {
                        name: "SK"
                    }
                ]
            }
        ]
    }),
    /**
     * Primary key for the DynamoDB.
     * It is constructed out of tenant, so different tenants do not have access to others data, and a name of this API entity.
     */
    createPk: (context, id) => {
        const tenant = context.security.getTenant();
        if (!tenant) {
            throw new WebinyError(`There is no tenant on "context.security".`);
        }
        return `T#${tenant.id}#target#${id}`;
        /**
         * If you want to use different locales per target, uncomment code below.
         * And remove the return above.
         */
        // const locale = context.i18n.getCurrentLocale();
        // if (!locale) {
        //     throw new WebinyError(`There is no locale on "context.i18n".`)
        // }
        // return `T#${tenant.id}#L#${locale.code}#target#${id}`;
    }
};
