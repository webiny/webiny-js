import { createFeature } from "@webiny/feature/api";
import { CandidateReadAccess } from "./CandidateReadAccess.js";

export const CandidateReadAccessFeature = createFeature({
    name: "Workflows/CandidateReadAccess",
    register(container) {
        // One instance per request container, so candidate identities are reused (R69).
        container.register(CandidateReadAccess).inSingletonScope();
    }
});
