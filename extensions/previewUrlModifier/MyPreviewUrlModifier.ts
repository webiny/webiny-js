import { PreviewUrlModifier } from "webiny/admin/website-builder";

class MyPreviewUrlModifier implements PreviewUrlModifier.Interface {
    getQueryParams() {
        return { "x-my-token": "abc123" };
    }
}

export default PreviewUrlModifier.createImplementation({
    implementation: MyPreviewUrlModifier,
    dependencies: []
});
