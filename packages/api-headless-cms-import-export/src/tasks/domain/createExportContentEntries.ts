import { createS3Client } from "@webiny/aws-sdk/client-s3";
import { getBucket } from "~/tasks/utils/helpers/getBucket";

import { ZipCombiner } from "~/tasks/utils/zipCombiner";
import {
    ExportContentEntries,
    ICreateCmsEntryZipperConfig,
    ICreateZipCombinerParams
} from "~/tasks/domain/exportContentEntries/ExportContentEntries";
import { createUploadFactory } from "../utils/Upload";
import { Zipper } from "../utils/Zipper";
import { Archiver } from "../utils/Archiver";
import { CmsEntryZipper } from "../utils/cmsEntryZipper";
import { UrlSigner } from "~/tasks/utils/urlSigner";
import { FileFetcher } from "~/tasks/utils/fileFetcher";

export const createExportContentEntries = () => {
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

    const createCmsEntryZipper = (config: ICreateCmsEntryZipperConfig) => {
        const upload = createUpload(config.filename);

        const archiver = new Archiver({
            format: "zip",
            options: {
                gzip: true,
                gzipOptions: {
                    level: 9
                }
            }
        });

        const zipper = new Zipper({
            upload,
            archiver
        });

        return new CmsEntryZipper({
            fetcher: config.fetcher,
            urlSigner,
            zipper
        });
    };

    const createZipCombiner = (config: ICreateZipCombinerParams) => {
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

    return new ExportContentEntries({
        createCmsEntryZipper,
        createZipCombiner
    });
};
