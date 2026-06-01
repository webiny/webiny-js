import { FileUrlFormatter } from "webiny/admin/ui/file-manager";

class MyFileUrlFormatter implements FileUrlFormatter.Interface {
    format(url: URL, params?: FileUrlFormatter.Params): void {
        if (params?.width !== undefined) {
            url.searchParams.set("my_width", String(params.width));
        }
    }
}

export const MyFileUrlFormatterImpl = FileUrlFormatter.createImplementation({
    implementation: MyFileUrlFormatter,
    dependencies: []
});
