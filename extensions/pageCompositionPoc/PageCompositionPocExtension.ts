import { createFeature } from "webiny/api";
import { PageCompositionPocFeature } from "webiny/api/page-composition-poc";

/**
 * Enables the page-composition PROOF OF CONCEPT on this project.
 *
 * It turns a finished component-extraction run into published Website Builder pages, so a migrated
 * site can be browsed. THROWAWAY: it exists for a customer demo on five sites and will be deleted
 * rather than evolved — read the README of `@webiny/api-page-composition-poc` before building on it.
 *
 * Requires component extraction to be registered too (it reads a run's artifacts), and a run whose
 * Assemble and Promote stages are both done.
 */
export default createFeature({
    name: "MyApp/PageCompositionPoc",
    register(container) {
        PageCompositionPocFeature.register(container);
    }
});
