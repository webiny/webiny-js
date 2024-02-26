import { FileUploaderPlugin, UploadOptions } from "@webiny/app/types";
import { SimpleUploadStrategy } from "~/SimpleUploadStrategy";
import { MultiPartUploadStrategy } from "~/MultiPartUploadStrategy";

export interface FileUploadStrategy {
    upload: FileUploaderPlugin["upload"];
}

export default (): FileUploaderPlugin => {
    class S3FileUploader implements FileUploaderPlugin {
        public readonly type = "file-uploader";
        public readonly name = "file-uploader";

        upload(file: File, options: UploadOptions) {
            // Use "simple" strategy for files smaller than ~100MB
            // @ts-expect-error
            const multiPartThreshold = window["fmUploadMultiPartThreshold"] ?? 100;
            const simple = file.size < multiPartThreshold * 1024 * 1024;

            const strategy: FileUploadStrategy = simple
                ? new SimpleUploadStrategy()
                : new MultiPartUploadStrategy();

            return strategy.upload(file, options);
        }
    }

    return new S3FileUploader();
};
