import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ADMIN } from "./identities.js";

/** A stand-in `wb.page` loader, so CMS tests can create a Website Builder review (R46). */
class FakeWbPageTargetLoaderImpl implements ReviewTargetLoader.Interface {
    public canLoad(model: string): boolean {
        return model === "wb.page";
    }

    public async load(): Promise<ReviewTargetLoader.Target | null> {
        return {
            title: "Page 1",
            context: {
                folder: null,
                modelId: "wbyWbPage",
                title: "Page 1",
                author: { id: ADMIN.id, displayName: ADMIN.displayName }
            }
        };
    }
}

export const FakeWbPageTargetLoader = ReviewTargetLoader.createImplementation({
    implementation: FakeWbPageTargetLoaderImpl,
    dependencies: []
});
