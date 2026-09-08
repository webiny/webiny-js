import { createFeature } from "@webiny/feature/api";
import { registerHttpRoute } from "@webiny/event-handler-core";
import { GraphQLSchemaComposerFeature } from "~/features/GraphQLSchemaBuilder/feature.js";
import { GraphQLEngine } from "./GraphQLEngine.js";
import { GraphQLRoute } from "./GraphQLRoute.js";

export const GraphQLEngineFeature = createFeature({
    name: "GraphQLEngine",
    register(container) {
        GraphQLSchemaComposerFeature.register(container);
        container.register(GraphQLEngine);
        registerHttpRoute(container, GraphQLRoute);
    }
});
