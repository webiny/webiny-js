// @flow
import _ from "lodash";
import { GraphQLUnionType } from "graphql";
import type { Schema } from "webiny-api/types";

export default (schema: Schema) => {
    // Create EntityType to represent all entities in the system
    schema.addType({
        meta: {
            type: "union"
        },
        type: new GraphQLUnionType({
            name: "EntityType",
            types: () => {
                const attrTypes = [];
                _.each(schema.types, ({ meta, type }) => {
                    if (meta && meta.type === "entity") {
                        attrTypes.push(type);
                    }
                });
                return attrTypes;
            },
            resolveType(entity) {
                return schema.getType(entity.classId);
            }
        })
    });
};
