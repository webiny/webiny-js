import type { FileUrlParams } from "@webiny/admin-ui";
import { FileUrlFormatter } from "./abstractions.js";

class FileUrlFormatterImpl implements FileUrlFormatter.Interface {
    format(url: URL, params?: FileUrlParams): void {
        if (params?.width !== undefined) {
            url.searchParams.set("width", String(params.width));
        }
    }
}

export default FileUrlFormatter.createImplementation({
    implementation: FileUrlFormatterImpl,
    dependencies: []
});
