import { createFeature } from "@webiny/feature/api";
import { GraphQLSchemaBuilder } from "./GraphQLSchemaBuilder.js";

export const GraphQLSchemaBuilderFeature = createFeature({
    name: "GraphQLSchemaBuilder",
    register(container) {
        container.register(GraphQLSchemaBuilder);
    }
});
