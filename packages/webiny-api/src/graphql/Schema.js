// @flow
import { GraphQLSchema, GraphQLObjectType, GraphQLUnionType, GraphQLDirective } from "graphql";
import type { Entity } from "webiny-api";
import addEntityToSchema from "./utils/addEntityToSchema";
import addCrudOperations from "./utils/addCrudOperations";
import addDefaultTypes from "./utils/addDefaultTypes";

declare type SchemaEntityOptions = {
    crud: boolean
};

class Schema {
    attributeConverters: Array<Function>;
    types: Object;
    query: Object;
    mutation: Object;
    directives: Array<GraphQLDirective>;
    schemaHandlers: Array<Function>;
    beforeGraphQLSchema: Array<Function>;

    constructor() {
        this.attributeConverters = [];
        this.types = {};
        this.query = {};
        this.mutation = {};
        this.directives = [];
        this.schemaHandlers = [];
        this.beforeGraphQLSchema = [];

        addDefaultTypes(this);
    }

    addType(data: { meta?: Object, type: GraphQLObjectType | GraphQLUnionType }) {
        this.types[data.type.name] = data;
    }

    getType(name: string) {
        return (this.types[name] && this.types[name].type) || null;
    }

    registerEntity(entityClass: Class<Entity>, options?: SchemaEntityOptions = { crud: true }) {
        // 1. Create entity type (and all related types recursively)
        addEntityToSchema(entityClass, this);
        // 2. optionally create CRUD fields
        if (options && options.crud) {
            addCrudOperations(entityClass, this);
        }
    }

    addAttributeConverter(converter: Function) {
        this.attributeConverters.unshift(converter);
    }

    generate(): GraphQLSchema {
        this.schemaHandlers.map(cb => cb(this));

        this.beforeGraphQLSchema.map(cb => cb(this));

        let mutation = null;
        if (Object.keys(this.mutation).length) {
            mutation = new GraphQLObjectType({
                name: "Mutation",
                fields: this.mutation
            });
        }

        return new GraphQLSchema({
            query: new GraphQLObjectType({
                name: "Query",
                fields: this.query
            }),
            mutation
        });
    }
}

export default Schema;
