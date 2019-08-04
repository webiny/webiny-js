// @flow
import { ObjectId } from "mongodb";
import { ListResponse, ListErrorResponse } from "webiny-api/graphql";
import type { HeadlessFieldTypePlugin } from "webiny-api-headless/types";
import { createReadTypeName } from "webiny-api-headless/utils/createTypeName";
import createListArgs from "webiny-api-headless/utils/createListArgs";
import findEntry from "webiny-api-headless/utils/findEntry";
import findEntries from "webiny-api-headless/utils/findEntries";
import genericFieldValueSetter from "webiny-api-headless/utils/genericFieldValueSetter";
import genericFieldValueResolver from "webiny-api-headless/utils/genericFieldValueResolver";

export default ({
    name: "cms-headless-field-type-ref",
    type: "cms-headless-field-type",
    fieldType: "ref",
    isSortable: false,
    read: {
        createTypeField({ model, field }) {
            const { modelId, type } = field.settings;
            const many = type === "many";
            const gqlType = createReadTypeName(modelId);
            const fieldArgs = many ? createListArgs({ model, field }) : "";

            return field.fieldId + fieldArgs + `: ${many ? `${gqlType}ListResponse` : gqlType}`;
        },
        createResolver({ models, field }) {
            const { type, modelId } = field.settings;
            const refModel = models.find(m => m.modelId === modelId);

            return async (entry, args, context, info) => {
                const refValue = genericFieldValueResolver(entry, args, context, info);

                if (!refValue) {
                    return null;
                }

                if (type === "one") {
                    return findEntry({
                        model: refModel,
                        args: { where: { _id: ObjectId(refValue) } },
                        context
                    });
                }

                // Load "many" entries
                const { where = {}, ...rest } = args;
                where["id_in"] = refValue || [];

                try {
                    const { entries, meta } = await findEntries({
                        model: refModel,
                        args: { where, ...rest },
                        context,
                        info
                    });

                    return new ListResponse(entries, meta);
                } catch (err) {
                    return new ListErrorResponse({
                        code: err.code,
                        error: err.message
                    });
                }
            };
        }
    },
    manage: {
        setEntryFieldValue: genericFieldValueSetter,
        createTypes() {
            return /* GraphQL */ `
                type HeadlessManageRefOne {
                    locale: String
                    value: ID
                }

                input HeadlessManageRefOneInput {
                    locale: String!
                    value: ID!
                }

                type HeadlessManageRefMany {
                    locale: String
                    value: [ID]
                }

                input HeadlessManageRefManyInput {
                    locale: String!
                    value: [ID!]
                }
            `;
        },
        createTypeField({ field }) {
            const { type } = field.settings;

            return (
                field.fieldId +
                `: ${type === "many" ? `[HeadlessManageRefMany]` : `[HeadlessManageRefOne]`}`
            );
        },
        createInputField({ field }) {
            const { type } = field.settings;

            return (
                field.fieldId +
                `: ${
                    type === "many" ? "[HeadlessManageRefManyInput]" : "[HeadlessManageRefOneInput]"
                }`
            );
        }
    }
}: HeadlessFieldTypePlugin);
