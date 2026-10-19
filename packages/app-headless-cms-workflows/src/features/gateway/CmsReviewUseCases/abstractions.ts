import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewUseCases } from "@webiny/app-workflows/review/useCases/IReviewUseCases.js";

export const CmsReviewUseCases = createAbstraction<IReviewUseCases>("Cms/Workflows/ReviewUseCases");

export namespace CmsReviewUseCases {
    export type Interface = IReviewUseCases;
}
