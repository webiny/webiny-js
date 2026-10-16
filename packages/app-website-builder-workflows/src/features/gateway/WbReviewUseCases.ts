import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewUseCases } from "@webiny/app-workflows/review/useCases/IReviewUseCases.js";

export const WbReviewUseCases = createAbstraction<IReviewUseCases>(
    "WebsiteBuilder/Workflows/ReviewUseCases"
);

export namespace WbReviewUseCases {
    export type Interface = IReviewUseCases;
}
