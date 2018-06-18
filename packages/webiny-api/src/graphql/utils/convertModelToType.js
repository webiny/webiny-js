// @flow
import _ from "lodash";
import { GraphQLObjectType, GraphQLNonNull } from "graphql";
import type { Attribute } from "webiny-model";
import type Schema from "./../Schema";
import debug from "debug";

const log = debug("webiny-api:schema");

// Attributes to exclude from type generation
const skip = ["deleted"];

const convertModelToType = (typeName: string, meta: Object, attributes: Object, schema: Schema) => {
    // Create model type
    if (schema.types[typeName]) {
        return schema.getType(typeName);
    }

    schema.addType({
        meta,
        type: new GraphQLObjectType({
            name: typeName,
            fields: () => {
                const fields = {};

                Object.values(attributes).map(attr => {
                    attr = ((attr: any): Attribute);
                    if (!attr.getName() || skip.includes(attr.getName())) {
                        return;
                    }

                    // Try to map entity attribute to GraphQL type
                    let attrType = null;
                    _.each(schema.attributeConverters, converter => {
                        attrType = converter({ attr, schema, convertModelToType });
                        if (attrType) {
                            return false;
                        }
                    });

                    // Make field required based on the entity attribute validator
                    if (attrType) {
                        const validators = attr.getValidators();
                        if (
                            validators &&
                            typeof validators === "string" &&
                            validators.includes("required")
                        ) {
                            attrType.type = new GraphQLNonNull(attrType.type);
                        }
                    }

                    if (!attrType) {
                        log(
                            "Missing converter for %o on %o (%o)",
                            attr.constructor.name,
                            typeName,
                            attr.getName()
                        );
                        return;
                    }

                    fields[attr.getName()] = attrType;
                });

                return fields;
            }
        })
    });

    return schema.getType(typeName);
};

export default convertModelToType;
