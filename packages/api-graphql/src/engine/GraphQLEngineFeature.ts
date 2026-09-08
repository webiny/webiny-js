import { createFeature } from "@webiny/feature/api";
import { HttpRouteDefinition } from "@webiny/event-handler-core";
import { GraphQLSchemaComposerFeature } from "~/features/GraphQLSchemaBuilder/feature.js";
import { GraphQLEngine } from "./GraphQLEngine.js";
import { GraphQLRouteDefinition } from "./GraphQLRoute.js";

export const GraphQLEngineFeature = createFeature({
    name: "GraphQLEngine",
    register(container) {
        GraphQLSchemaComposerFeature.register(container);
        container.register(GraphQLEngine);
        container.registerInstance(HttpRouteDefinition, GraphQLRouteDefinition);
    }
});
