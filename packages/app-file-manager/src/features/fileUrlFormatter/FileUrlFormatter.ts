import type { FileUrlParams } from "@webiny/admin-ui";
import { FileUrlFormatter } from "./abstractions.js";

class FileUrlFormatterImpl implements FileUrlFormatter.Interface {
    format(url: URL | string, params?: FileUrlParams): string {
        try {
            const result = new URL(url.toString());
            if (params?.width !== undefined) {
                result.searchParams.set("width", String(params.width));
            }
            return result.toString();
        } catch {
            return url.toString();
        }
    }
}

export default FileUrlFormatter.createImplementation({
    implementation: FileUrlFormatterImpl,
    dependencies: []
});
