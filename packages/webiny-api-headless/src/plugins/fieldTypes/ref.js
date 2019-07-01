// @flow
import { ObjectId } from "mongodb";
import { ListResponse } from "webiny-api/graphql";
import type { HeadlessFieldTypePlugin } from "webiny-api-headless/types";
import createTypeName from "webiny-api-headless/utils/createTypeName";
import createListArgs from "webiny-api-headless/utils/createListArgs";
import findEntry from "webiny-api-headless/utils/findEntry";
import findEntries from "webiny-api-headless/utils/findEntries";
import genericFieldValueSetter from "webiny-api-headless/utils/genericFieldValueSetter";
import genericFieldValueResolver from "webiny-api-headless/utils/genericFieldValueResolver";

export default ({
    name: "cms-headless-field-type-ref",
    type: "cms-headless-field-type",
    fieldType: "ref",
    read: {
        createTypeField({ model, field }) {
            const { modelId, type } = field.settings;
            const many = type === "many";
            const gqlType = createTypeName(modelId);
            const fieldArgs = many ? createListArgs({ model, field }) : "";

            return field.fieldId + fieldArgs + `: ${many ? `${gqlType}ListResponse` : gqlType}`;
        },
        createResolver({ models, field }) {
            const { type, modelId } = field.settings;
            const refModel = models.find(m => m.modelId === modelId);

            return async (entry, args, context, info) => {
                const refValue = genericFieldValueResolver(entry, args, context, info);

                if (!refValue) {
                    return new ListResponse([], {});
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

                const { entries, meta } = await findEntries({
                    model: refModel,
                    args: { where, ...rest },
                    context,
                    info
                });

                return new ListResponse(entries, meta);
            };
        }
    },
    manage: {
        setEntryFieldValue: genericFieldValueSetter,
        createTypes() {
            return /* GraphQL */ `
                type Manage_HeadlessRefOne {
                    locale: String
                    value: ID
                }

                input Manage_HeadlessRefOneInput {
                    locale: String!
                    value: ID!
                }

                type Manage_HeadlessRefMany {
                    locale: String
                    value: [ID]
                }

                input Manage_HeadlessRefManyInput {
                    locale: String!
                    value: [ID!]
                }
            `;
        },
        createTypeField({ field }) {
            const { type } = field.settings;

            return (
                field.fieldId +
                `: ${type === "many" ? `[Manage_HeadlessRefMany]` : `[Manage_HeadlessRefOne]`}`
            );
        },
        createInputField({ field }) {
            const { type } = field.settings;

            return (
                field.fieldId +
                `: ${
                    type === "many"
                        ? "[Manage_HeadlessRefManyInput]"
                        : "[Manage_HeadlessRefOneInput]"
                }`
            );
        }
    }
}: HeadlessFieldTypePlugin);
