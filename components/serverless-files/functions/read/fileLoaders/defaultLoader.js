// @flow
import type { DownloadFileProcessorType } from "webiny-proxy-files/types";

export default ({
    canProcess: () => {
        return true;
    },
    async process({ site, file, s3 }) {
        const params = s3.getObjectParams(file.name);
        const s3Object = await s3.getObject({ params });
        return {
            src: s3.getObjectUrl(params.Key),
            contentType: s3Object.ContentType
        };
    }
}: DownloadFileProcessorType);
