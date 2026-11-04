import type { Result } from "@webiny/feature/api";
import type { CmsContext, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { PageModelProvider } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { CreatePageUseCase } from "@webiny/api-website-builder/features/pages/CreatePage/index.js";

/** Returns the value of an ok result; throws the error otherwise, so setup fails at its cause. */
export const expectOk = <TValue, TError>(result: Result<TValue, TError>): TValue => {
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

export const getPageModel = (context: CmsContext): Promise<CmsModel> => {
    return context.container.resolve(PageModelProvider).get();
};

export interface PageParams {
    title: string;
    /** Defaults to the root folder. */
    folderId?: string;
}

let pathCounter = 0;

/** Creates a draft page (revision 1) as the context's identity. */
export const createPage = async (context: CmsContext, params: PageParams): Promise<WbPage> => {
    pathCounter++;
    return expectOk(
        await context.container.resolve(CreatePageUseCase).execute({
            properties: { title: params.title, path: `/workflow-page-${pathCounter}` },
            metadata: {},
            bindings: {},
            elements: {},
            location: { folderId: params.folderId ?? "root" }
        })
    );
};
