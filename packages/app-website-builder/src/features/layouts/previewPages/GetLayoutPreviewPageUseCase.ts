import {
    GetLayoutPreviewPageUseCase as UseCaseAbstraction,
    LayoutPreviewPagesGateway
} from "./abstractions.js";

class GetLayoutPreviewPageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: LayoutPreviewPagesGateway.Interface) {}

    execute(pageId: string) {
        return this.gateway.getPage(pageId);
    }
}

export const GetLayoutPreviewPageUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLayoutPreviewPageUseCaseImpl,
    dependencies: [LayoutPreviewPagesGateway]
});
