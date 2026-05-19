import { PreviewUrlModifier } from "webiny/admin/website-builder";

class MyPreviewUrlModifier implements PreviewUrlModifier.Interface {
    async modify(url: URL) {
        url.searchParams.set("x-my-token", "abc123");
    }
}

export default PreviewUrlModifier.createImplementation({
    implementation: MyPreviewUrlModifier,
    dependencies: []
});
