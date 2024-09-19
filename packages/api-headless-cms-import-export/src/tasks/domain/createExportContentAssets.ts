import type { ICreateCmsAssetsZipperCallable } from "./exportContentAssets/ExportContentAssets";
import { ExportContentAssets } from "./exportContentAssets/ExportContentAssets";
import { createS3Client } from "@webiny/aws-sdk/client-s3";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { CmsAssetsZipper } from "../utils/cmsAssetsZipper";
import { createUploadFactory } from "~/tasks/utils/upload";
import { createArchiver } from "~/tasks/utils/archiver";
import { Zipper } from "~/tasks/utils/zipper";
import { WEBINY_EXPORT_ASSETS_EXTENSION } from "~/tasks/constants";

export const createExportContentAssets = () => {
    const client = createS3Client();
    const bucket = getBucket();
    const createUpload = createUploadFactory({
        client,
        bucket
    });

    const createCmsAssetsZipper: ICreateCmsAssetsZipperCallable = config => {
        const upload = createUpload(config.filename);

        const archiver = createArchiver({
            format: "zip",
            options: {
                gzip: true,
                /**
                 * No point in compressing the assets, since they are already compressed.
                 */
                gzipOptions: {
                    level: 0
                },
                comment: WEBINY_EXPORT_ASSETS_EXTENSION
            }
        });

        const zipper = new Zipper({
            upload,
            archiver
        });

        return new CmsAssetsZipper({
            entryFetcher: config.entryFetcher,
            createEntryAssets: config.createEntryAssets,
            createEntryAssetsResolver: config.createEntryAssetsResolver,
            fileFetcher: config.fileFetcher,
            zipper
        });
    };

    return new ExportContentAssets({
        createCmsAssetsZipper
    });
};
