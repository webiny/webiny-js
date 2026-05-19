import { FileUrlFormatter } from "./abstractions.js";

class FileUrlFormatterImpl implements FileUrlFormatter.Interface {
    format(url: URL, params?: FileUrlFormatter.Params): void {
        if (params?.width !== undefined) {
            url.searchParams.set("width", String(params.width));
        }
    }
}

export default FileUrlFormatter.createImplementation({
    implementation: FileUrlFormatterImpl,
    dependencies: []
});
