import { createFeature } from "@webiny/feature/api";
import { BaseGraphQLSchema } from "./graphql/BaseGraphQLSchema.js";

export const Extension = createFeature({
    name: "Languages",
    register(container) {
        // Features
        // TODO

        // GraphQL
        container.register(BaseGraphQLSchema);
    }
});
