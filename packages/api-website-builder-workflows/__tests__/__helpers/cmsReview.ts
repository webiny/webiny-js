import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { expectOk } from "./pages.js";
import { createWbWorkflowValues, WB_ADMIN_ACTOR } from "./engine.js";
import { ARTICLE_NAMESPACE } from "./cmsModel.js";
import { REQUESTER, toActor } from "./identities.js";

/** A review of a Headless CMS entry (`cms.article`), through the engine, for cross-app tests (R46). */
export const createCmsReview = async (admin: CmsContext): Promise<ReviewData> => {
    expectOk(
        await admin.container.resolve(StoreWorkflowUseCase).execute({
            workflow: {
                ...createWbWorkflowValues(),
                id: "cms-workflow",
                models: [ARTICLE_NAMESPACE]
            },
            actor: WB_ADMIN_ACTOR
        })
    );
    const model = expectOk(await admin.container.resolve(GetModelUseCase).execute("article"));
    const article = expectOk(
        await admin.container
            .resolve(CreateEntryUseCase)
            .execute(model, { values: { title: "Article 1" } })
    );
    return expectOk(
        await admin.container.resolve(RequestReviewUseCase).execute({
            model: ARTICLE_NAMESPACE,
            targetId: article.entryId,
            targetRevisionId: article.id,
            actor: toActor(REQUESTER)
        })
    );
};
