import type { ICreateCmsAssetsZipperCallable } from "./ExportContentAssets.js";
import { ExportContentAssets } from "./ExportContentAssets.js";
import { createS3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { getBucket } from "~/tasks/utils/helpers/getBucket.js";
import { CmsAssetsZipper } from "~/tasks/utils/cmsAssetsZipper/index.js";
import { createUploadFactory } from "~/tasks/utils/upload/index.js";
import { createArchiver } from "~/tasks/utils/archiver/index.js";
import { Zipper } from "~/tasks/utils/zipper/index.js";
import { WEBINY_EXPORT_ASSETS_EXTENSION } from "~/tasks/constants.js";
import type { Context } from "~/types.js";

export const createExportContentAssets = (context: Context) => {
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
        context,
        createCmsAssetsZipper
    });
};
