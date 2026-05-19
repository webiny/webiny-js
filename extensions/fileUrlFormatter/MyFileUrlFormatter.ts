import { FileUrlFormatter } from "webiny/admin/file-manager";
import type { FileUrlParams } from "@webiny/admin-ui";

class MyFileUrlFormatter implements FileUrlFormatter.Interface {
    format(url: URL | string, params?: FileUrlParams): string {
        try {
            const result = new URL(url.toString());
            if (params?.width !== undefined) {
                result.searchParams.set("my_width", String(params.width));
            }
            return result.toString();
        } catch {
            return url.toString();
        }
    }
}

export default FileUrlFormatter.createImplementation({
    implementation: MyFileUrlFormatter,
    dependencies: []
});
