import { createFeature } from "@webiny/feature/api";
import { GraphQLSchemaComposerFeature } from "~/features/GraphQLSchemaBuilder/feature.js";
import { GraphQLEngineImpl } from "./GraphQLEngineImpl.js";

export const GraphQLEngineFeature = createFeature({
    name: "GraphQLEngine",
    register(container) {
        GraphQLSchemaComposerFeature.register(container);
        container.register(GraphQLEngineImpl);
    }
});
