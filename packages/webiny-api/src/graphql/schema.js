// @flow
import {
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLUnionType,
    GraphQLSchema
} from "graphql";
import getFieldsFromType from "./getFieldsFromType";

export class Schema {
    query: Object;
    mutation: Object;
    types: Object;
    schema: GraphQLSchema;

    constructor() {
        this.query = {};
        this.mutation = {};
        this.types = {};
    }

    addType(type: GraphQLObjectType | GraphQLUnionType | GraphQLInputObjectType) {
        this.types[type.name] = type;
    }

    getType(type: string) {
        return this.types[type];
    }

    addQueryField(field: Object) {
        this.query[field.name] = field;
    }

    getQueryField(field: string) {
        return this.query[field];
    }

    addMutationField(type: GraphQLObjectType) {
        this.mutation[type.name] = { type };
    }

    extend(type: string, extension: Function) {
        const fields = getFieldsFromType(this.getType(type));

        this.types[type] = new GraphQLObjectType({
            name: type,
            fields: extension(fields)
        });
    }

    getGraphQLSchema() {
        if (!this.schema) {
            let mutation = null;
            if (Object.keys(this.mutation).length) {
                mutation = new GraphQLObjectType({
                    name: "Mutation",
                    fields: this.mutation
                });
            }

            this.schema = new GraphQLSchema({
                query: new GraphQLObjectType({
                    name: "Query",
                    fields: this.query
                }),
                mutation
            });
        }

        return this.schema;
    }
}

export default new Schema();
