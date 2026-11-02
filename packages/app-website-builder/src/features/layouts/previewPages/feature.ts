import { createFeature } from "@webiny/feature/admin";
import { SharedPageInfrastructureFeature } from "~/features/pages/shared/feature.js";
import { ListPagesFeature } from "~/features/pages/listPages/feature.js";
import {
    GetLayoutPreviewPageUseCase as GetPageAbstraction,
    ListLayoutPreviewPagesUseCase as ListPagesAbstraction
} from "./abstractions.js";
import { LayoutPreviewPagesGateway } from "./LayoutPreviewPagesGateway.js";
import { ListLayoutPreviewPagesUseCase } from "./ListLayoutPreviewPagesUseCase.js";
import { GetLayoutPreviewPageUseCase } from "./GetLayoutPreviewPageUseCase.js";

/**
 * Pages to preview a layout with in the layout editor. Pages are listed with the pages list use case.
 */
export const LayoutPreviewPagesFeature = createFeature({
    name: "WebsiteBuilder/LayoutPreviewPages",
    register(container) {
        // The pages list registers these in its own container; their caches are shared instances.
        SharedPageInfrastructureFeature.register(container);
        ListPagesFeature.register(container);
        container.register(LayoutPreviewPagesGateway).inSingletonScope();
        container.register(ListLayoutPreviewPagesUseCase);
        container.register(GetLayoutPreviewPageUseCase);
    },
    resolve(container) {
        return {
            listPages: container.resolve(ListPagesAbstraction),
            getPage: container.resolve(GetPageAbstraction)
        };
    }
});
