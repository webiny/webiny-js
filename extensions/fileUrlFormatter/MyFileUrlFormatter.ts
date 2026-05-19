import { FileUrlFormatter } from "webiny/admin/file-manager";
import type { FileUrlParams } from "@webiny/admin-ui";

class MyFileUrlFormatter implements FileUrlFormatter.Interface {
    format(url: URL, params?: FileUrlParams): void {
        if (params?.width !== undefined) {
            url.searchParams.set("my_width", String(params.width));
        }
    }
}

export default FileUrlFormatter.createImplementation({
    implementation: MyFileUrlFormatter,
    dependencies: []
});
