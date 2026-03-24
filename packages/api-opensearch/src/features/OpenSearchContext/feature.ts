import { createFeature } from "@webiny/feature/api/index.js";
import { OpenSearchContext } from "./abstraction.js";
import { OpenSearchContext as OpenSearchContextType } from "~/types.js";
import { OpenSearchContext as OpenSearchContextImplementation } from "./OpenSearchContext.js";

export const OpenSearchContextFeature = createFeature<OpenSearchContextType>({
    name: "opensearch.internal.context",
    register(container, context) {
        container.registerFactory(OpenSearchContext, () => {
            return new OpenSearchContextImplementation(context!);
        });
    }
});
