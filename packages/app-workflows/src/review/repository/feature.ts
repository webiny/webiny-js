import { createFeature } from "@webiny/feature/admin";
import { ReviewGateway } from "~/review/gateway/ReviewGateway.js";
import { ReviewRepository } from "./ReviewRepository.js";

/*
 * The review area's routing gateway and repository, both singletons (R343, R354): one workflow
 * cache per admin. Registered by `ReviewServicesFeature`; no `resolve` (the Dashboard form).
 */
export const ReviewRepositoryFeature = createFeature({
    name: "Workflows/ReviewRepository",
    register(container) {
        container.register(ReviewGateway).inSingletonScope();
        container.register(ReviewRepository).inSingletonScope();
    }
});
