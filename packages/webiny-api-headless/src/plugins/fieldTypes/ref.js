// @flow
import { ObjectID } from "mongodb";
import { ListResponse } from "webiny-api/graphql";
import type { HeadlessFieldTypePlugin } from "webiny-api-headless/types";
import {
    createTypeName,
    createEntityName,
    createListArgs,
    createValidator
} from "webiny-api-headless/utils";

export default ({
    name: "cms-headless-field-type-ref",
    type: "cms-headless-field-type",
    fieldType: "ref",
    createAttribute({ field, entity, context }) {
        const { type } = field.settings;

        if (type === "one") {
            entity
                .attr(field.fieldId)
                .char()
                .setValidators(createValidator({ field, entity, context }));
        } else {
            entity
                .attr(field.fieldId)
                .array()
                .setValidators(createValidator({ field, entity, context }));
        }
    },
    read: {
        createTypeField({ model, field }) {
            const { modelId, type } = field.settings;
            const many = type === "many";
            const gqlType = createTypeName(modelId);
            const fieldArgs = many ? createListArgs({ model, field }) : "";

            return field.fieldId + fieldArgs + `: ${many ? `${gqlType}ListResponse` : gqlType}`;
        },
        createResolver({ field }) {
            const { type, modelId } = field.settings;

            return async (entity, args, context, { fieldName }) => {
                const entityName = createEntityName(modelId);
                const Entity = context.cms.entities[entityName];

                if (type === "one") {
                    return Entity.findOne({ _id: ObjectID(entity[fieldName]) });
                }

                // Build parameters for `find`
                const { where, search, ...rest } = args;
                const find = {
                    query: { _id: { $in: entity[fieldName].map(id => ObjectID(id)) }, ...where },
                    ...rest
                };

                if (search && search.query) {
                    find.search = { ...search, operator: search.operator || "or" };
                }

                const data = await Entity.find(find);
                return new ListResponse(data, data.getMeta());
            };
        }
    },
    manage: {
        createTypeField({ field }) {
            const { modelId, type } = field.settings;
            const gqlType = createTypeName(modelId);

            return field.fieldId + `: ${type === "many" ? `${gqlType}ListResponse` : gqlType}`;
        },
        createInputField({ field }) {
            const { modelId, type } = field.settings;
            const gqlType = "Manage_" + createTypeName(modelId) + "Input";

            return field.fieldId + `: ${type === "many" ? `[${gqlType}]` : gqlType}`;
        }
    }
}: HeadlessFieldTypePlugin);
