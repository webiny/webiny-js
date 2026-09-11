import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { useTestRequest } from "../support/useTestRequest.js";
import { IntegrationTestModel } from "./testModel.js";

/**
 * A live request with the capture test model registered.
 *
 * The model has to be registered before the activity log is, which the shared harness guarantees
 * through its `setup` seam — capture reads the model's field labels at write time, so a model
 * registered afterwards would produce records whose labels came from nowhere.
 */
export const useCaptureHandler = (identity?: IdentityData) =>
    useTestRequest({
        identity,
        setup: container => container.register(IntegrationTestModel)
    });
