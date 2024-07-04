import {
    ExportContentAssets,
    ICreateCmsAssetsZipperCallable,
    ICreateZipCombinerCallable
} from "./exportContentAssets/ExportContentAssets";
import { createS3Client } from "@webiny/aws-sdk/client-s3";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { ZipCombiner } from "~/tasks/utils/zipCombiner";
import { CmsAssetsZipper } from "../utils/cmsAssetsZipper";
import { UrlSigner } from "~/tasks/utils/urlSigner";
import { FileFetcher } from "~/tasks/utils/fileFetcher";
import { createUploadFactory } from "~/tasks/utils/upload";
import { Archiver } from "~/tasks/utils/archiver";
import { Zipper } from "~/tasks/utils/zipper";

export const createExportContentAssets = () => {
    const client = createS3Client();
    const bucket = getBucket();
    const createUpload = createUploadFactory({
        client,
        bucket
    });

    const urlSigner = new UrlSigner({
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
            createEntryAssetsList: config.createEntryAssetsList,
            fileFetcher: config.fileFetcher,
            urlSigner,
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
            urlSigner
        });
    };
    return new ExportContentAssets({
        createCmsAssetsZipper,
        createZipCombiner
    });
};
