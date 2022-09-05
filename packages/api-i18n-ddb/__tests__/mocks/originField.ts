/**
 * Definition for the rich text field to use in the tests.
 * This will test the plugins:
 * - LocalesAttributePlugin - add new attribute to the Files entity definition
 * - GraphQLSchemaPlugin - add new schema definitions to the existing graphql
 */
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { LocalesAttributePlugin } from "~/plugins/LocalesAttributePlugin";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { I18NContext } from "@webiny/api-i18n/types";

const fieldName = "origin";
const allowedOrigins = ["webiny", "web"];

const verifyOrigin = (origin: string): void => {
    if (allowedOrigins.includes(origin.toLowerCase())) {
        return;
    }
    throw new WebinyError(`Origin must be set to one of: ${allowedOrigins.join(", ")}.`);
};
export default () => [
    /**
     * Must add new field to attributes of the object being stored and to the Entity definition.
     */
    new LocalesAttributePlugin({
        attribute: fieldName,
        params: {
            type: "string"
        }
    }),
    new GraphQLSchemaPlugin({
        typeDefs: `
            extend input I18NLocaleInput {
                origin: String
            }
            extend input I18NLocaleUpdateInput {
                origin: String
            }
            extend type I18NLocale {
                origin: String
            }
            extend input I18NListLocalesWhere {
                origin: String
            }
        `
    }),
    /**
     * We want to validate file data so we need to add the lifecycle events.
     */
    new ContextPlugin<I18NContext>(async context => {
        context.i18n.locales.onBeforeCreate.subscribe(async params => {
            const locale = params.locale as any;
            if (!locale.origin) {
                return;
            }
            verifyOrigin(locale.origin);
        });
        context.i18n.locales.onBeforeUpdate.subscribe(async params => {
            const locale = params.locale as any;
            if (!locale.origin) {
                return;
            }
            verifyOrigin(locale.origin);
        });
    })
];
