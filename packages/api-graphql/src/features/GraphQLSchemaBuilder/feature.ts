import { createFeature } from "@webiny/feature/api";
import { GraphQLSchemaComposer } from "./GraphQLSchemaComposer.js";

export const GraphQLSchemaComposerFeature = createFeature({
    name: "GraphQLSchemaComposer",
    register(container) {
        container.register(GraphQLSchemaComposer);
    }
});
