// @flow
import { GraphQLSchema } from "graphql";
import Schema from "./Schema";

class GraphQL {
    graphQLSchema: ?GraphQLSchema;
    workingSchema: Schema;

    constructor() {
        this.workingSchema = new Schema();
        this.graphQLSchema = null;
    }

    schema(handler: Function) {
        this.workingSchema.schemaHandlers.push(handler);
    }

    beforeSchema(cb: Function) {
        this.workingSchema.beforeGraphQLSchema.push(cb);
    }

    getSchema() {
        if (!this.graphQLSchema) {
            this.graphQLSchema = this.workingSchema.generate();
        }

        return this.graphQLSchema;
    }
}

export default GraphQL;
