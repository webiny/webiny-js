import {
    ExportContentAssets,
    ICreateCmsAssetsZipperCallable,
    ICreateZipCombinerCallable
} from "./exportContentAssets/ExportContentAssets";
import { createS3Client } from "@webiny/aws-sdk/client-s3";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { createUploadFactory } from "~/tasks/utils/Upload";
import { SignUrl } from "~/tasks/utils/SignUrl";
import { Archiver } from "~/tasks/utils/Archiver";
import { Zipper } from "~/tasks/utils/Zipper";
import { FileFetcher } from "~/tasks/utils/FileFetcher";
import { ZipCombiner } from "~/tasks/utils/zipCombiner";
import { CmsAssetsZipper } from "../utils/cmsAssetsZipper";

export const createExportContentAssets = () => {
    const client = createS3Client();
    const bucket = getBucket();
    const createUpload = createUploadFactory({
        client,
        bucket
    });

    const signUrl = new SignUrl({
        client,
        bucket
    });

    const createCmsAssetsZipper: ICreateCmsAssetsZipperCallable = config => {
        const upload = createUpload(config.filename);

        const archiver = new Archiver({
            format: "zip",
            options: {
                gzip: true,
                gzipOptions: {
                    level: 0
                }
            }
        });

        const zipper = new Zipper({
            upload,
            archiver
        });

        return new CmsAssetsZipper({
            entryFetcher: config.entryFetcher,
            createEntryAssets: config.createEntryAssets,
            assetFetcher: config.assetFetcher,
            signUrl,
            zipper
        });
    };

    const createZipCombiner: ICreateZipCombinerCallable = config => {
        const upload = createUpload(config.target);

        const fileFetcher = new FileFetcher({
            client,
            bucket
        });

        const archiver = new Archiver({
            format: "zip",
            options: {
                gzip: true,
                gzipOptions: {
                    level: 0
                }
            }
        });

        const zipper = new Zipper({
            upload,
            archiver
        });

        return new ZipCombiner({
            fileFetcher,
            zipper,
            signUrl
        });
    };
    return new ExportContentAssets({
        createCmsAssetsZipper,
        createZipCombiner
    });
};
