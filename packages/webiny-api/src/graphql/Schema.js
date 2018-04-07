// @flow
import { GraphQLSchema, GraphQLObjectType, GraphQLDirective } from "graphql";
import type { Entity } from "webiny-api";
import entityToSchema from "./utils/entityToSchema";

class Schema {
    types: Object;
    query: Object;
    mutation: Object;
    directives: Array<GraphQLDirective>;
    schemaHandlers: Array<Function>;
    beforeGraphQLSchema: Array<Function>;

    constructor() {
        this.types = {};
        this.query = {};
        this.mutation = {};
        this.directives = [];
        this.schemaHandlers = [];
        this.beforeGraphQLSchema = [];
    }

    crud(entityClass: Class<Entity>) {
        try {
            entityToSchema(entityClass, this);
        } catch (e) {
            console.error(e);
        }
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
