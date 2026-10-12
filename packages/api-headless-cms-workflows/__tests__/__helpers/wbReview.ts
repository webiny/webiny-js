import type { Container } from "@webiny/di";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { expectOk } from "./entries.js";
import { REQUESTER, toActor } from "./identities.js";
import { createUserContext } from "./userContext.js";
import { FakeWbPageTargetLoader } from "./FakeWbPageTargetLoader.js";

/**
 * A Website Builder review (`wb.page`) created through the engine as the admin: stores a
 * `wb-workflow` and requests the review. Lets CMS tests prove another app's review reads as not
 * found (R46).
 */
export const createWbReview = async () => {
    const admin = await createUserContext({
        legacyPlugins: [
            (container: Container) => {
                container.register(FakeWbPageTargetLoader);
            }
        ]
    });
    expectOk(
        await storeWorkflow(admin, { ...createWorkflowValues(["wb.page"]), id: "wb-workflow" })
    );
    return expectOk(
        await admin.container.resolve(RequestReviewUseCase).execute({
            model: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            actor: toActor(REQUESTER)
        })
    );
};
