// @flow
import type { Entity } from "./../../entities";
import { GraphQLObjectType } from "graphql/type";
import fieldOne from "./crud/fieldOne";
import fieldList from "./crud/fieldList";
import fieldCreate from "./crud/fieldCreate";
import fieldUpdate from "./crud/fieldUpdate";
import fieldDelete from "./crud/fieldDelete";

export default (entity: Class<Entity>, type: GraphQLObjectType) => {
    return {
        one: fieldOne(entity, type),
        list: fieldList(entity, type),
        create: fieldCreate(entity, type),
        update: fieldUpdate(entity, type),
        delete: fieldDelete(entity)
    };
};
