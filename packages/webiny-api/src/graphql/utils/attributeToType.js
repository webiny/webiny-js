// @flow
import {
    GraphQLList,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLBoolean,
    GraphQLNonNull,
    GraphQLObjectType
} from "graphql";

import GraphQLJSON from "graphql-type-json";
import * as attrs from "webiny-model";
import { EntityAttribute, EntitiesAttribute } from "webiny-entity";
import { ModelAttribute, ModelsAttribute } from "webiny-model";
import type { Attribute } from "webiny-model";
import type { Entity } from "webiny-entity";

export default (
    attr: Attribute,
    types: { [type: string]: GraphQLObjectType },
    modelToType: Function
) => {
    let type = null,
        resolve = null;
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

    if (attr instanceof attrs.ObjectAttribute) {
        type = GraphQLJSON;
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

    if (attr instanceof attrs.DateAttribute) {
        type = GraphQLString;
        resolve = (entity: Entity) => {
            const value = entity.getAttribute(attr.getName()).getValue();
            return value instanceof Date ? value.toISOString() : null;
        };
    }

    if (!type) {
        type = GraphQLString;
    }

    const validators = attr.getValidators();
    if (validators && typeof validators === "string" && validators.includes("required")) {
        type = new GraphQLNonNull(type);
    }

    return { type, resolve };
};
