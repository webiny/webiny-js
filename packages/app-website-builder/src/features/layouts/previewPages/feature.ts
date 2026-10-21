import { createFeature } from "@webiny/feature/admin";
import { ListPagesGateway } from "~/features/pages/listPages/ListPagesGateway.js";
import {
    GetLayoutPreviewPageUseCase as GetPageAbstraction,
    ListLayoutPreviewPagesUseCase as ListPagesAbstraction
} from "./abstractions.js";
import { LayoutPreviewPagesGateway } from "./LayoutPreviewPagesGateway.js";
import { ListLayoutPreviewPagesUseCase } from "./ListLayoutPreviewPagesUseCase.js";
import { GetLayoutPreviewPageUseCase } from "./GetLayoutPreviewPageUseCase.js";

/**
 * Pages to preview a layout with in the layout editor. Pages are listed with the pages list gateway.
 */
export const LayoutPreviewPagesFeature = createFeature({
    name: "WebsiteBuilder/LayoutPreviewPages",
    register(container) {
        // The pages list registers its own gateway in its own container.
        container.register(ListPagesGateway).inSingletonScope();
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
