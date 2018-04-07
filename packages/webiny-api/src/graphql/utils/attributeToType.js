// @flow
import {
    GraphQLList,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLBoolean,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLUnionType
} from "graphql";

import GraphQLJSON from "graphql-type-json";
import * as attrs from "webiny-model";
import { EntityAttribute, EntitiesAttribute } from "webiny-entity";
import { ModelAttribute, ModelsAttribute } from "webiny-model";
import type { Attribute } from "webiny-model";

export default (
    attr: Attribute,
    types: { [type: string]: GraphQLObjectType },
    modelToType: Function
) => {
    let type = null;
    if (attr instanceof attrs.BooleanAttribute) {
        type = GraphQLBoolean;
    }

    if (attr instanceof attrs.IntegerAttribute) {
        type = GraphQLInt;
    }

    if (attr instanceof attrs.FloatAttribute) {
        type = GraphQLFloat;
    }

    if (attr instanceof attrs.ArrayAttribute) {
        type = new GraphQLList(GraphQLJSON);
    }

    if (attr instanceof ModelAttribute) {
        const model = attr.getModelInstance();
        const typeName = model.classId;
        type = types[typeName] || modelToType(model.classId, model.getAttributes(), types);
    }

    if (attr instanceof ModelsAttribute) {
        const model = attr.getModelInstance();
        const typeName = model.classId;
        type = new GraphQLList(
            types[typeName] || modelToType(model.classId, model.getAttributes(), types)
        );
    }

    if (attr instanceof EntityAttribute) {
        const entityClass = attr.getEntityClasses();
        if (Array.isArray(entityClass)) {
            // TODO: Create UNION type
        } else {
            const entity = new entityClass();
            const typeName = entity.classId;

            type = types[typeName] || modelToType(entity.classId, entity.getAttributes(), types);
        }
    }

    if (attr instanceof EntitiesAttribute) {
        const entityClass = attr.getEntitiesClass();
        const entity = new entityClass();
        const typeName = entity.classId;

        type = new GraphQLList(
            types[typeName] || modelToType(entity.classId, entity.getAttributes(), types)
        );
    }

    if (attr instanceof attrs.DynamicAttribute) {
        type = GraphQLJSON;
    }

    if (!type) {
        type = GraphQLString;
    }

    const validators = attr.getValidators();
    if (validators && typeof validators === "string" && validators.includes("required")) {
        type = new GraphQLNonNull(type);
    }

    return type;
};
