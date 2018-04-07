// @flow
import { GraphQLObjectType } from "graphql";
import type { Attribute } from "webiny-model";
import attributeToType from "./attributeToType";

// Attributes to exclude from type generation
const skip = ["deleted"];

const modelToType = (
    classId: string,
    attributes: Object,
    types: { [type: string]: GraphQLObjectType }
) => {
    // Create model type
    if (types[classId]) {
        return types[classId];
    }

    types[classId] = new GraphQLObjectType({
        name: classId,
        fields: () => {
            const fields = {};

            Object.values(attributes).map((attr: Attribute) => {
                if (!attr.getName() || skip.includes(attr.getName())) {
                    return;
                }

                fields[attr.getName()] = { type: attributeToType(attr, types, modelToType) };
            });

            return fields;
        }
    });

    return types[classId];
};

export default modelToType;
