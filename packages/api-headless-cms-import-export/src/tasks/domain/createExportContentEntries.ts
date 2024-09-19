import { createS3Client } from "@webiny/aws-sdk/client-s3";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { ExportContentEntries } from "~/tasks/domain/exportContentEntries/ExportContentEntries";
import type { ICreateCmsEntryZipperConfig } from "~/tasks/domain/exportContentEntries/ExportContentEntries";
import { CmsEntryZipper } from "../utils/cmsEntryZipper";
import { createUploadFactory } from "~/tasks/utils/upload";
import { createArchiver } from "~/tasks/utils/archiver";
import { Zipper } from "~/tasks/utils/zipper";
import { EntryAssets } from "../utils/entryAssets";
import { UniqueResolver } from "~/tasks/utils/uniqueResolver/UniqueResolver";
import { WEBINY_EXPORT_ENTRIES_EXTENSION } from "~/tasks/constants";

export const createExportContentEntries = () => {
    const client = createS3Client();
    const bucket = getBucket();
    const createUpload = createUploadFactory({
        client,
        bucket
    });

    const createCmsEntryZipper = (config: ICreateCmsEntryZipperConfig) => {
        const upload = createUpload(config.filename);

        const archiver = createArchiver({
            format: "zip",
            options: {
                gzip: true,
                gzipOptions: {
                    level: 9
                },
                comment: WEBINY_EXPORT_ENTRIES_EXTENSION
            }
        });

        const zipper = new Zipper({
            upload,
            archiver
        });

        return new CmsEntryZipper({
            fetcher: config.fetcher,
            zipper,
            entryAssets: new EntryAssets({
                uniqueResolver: new UniqueResolver(),
                traverser: config.traverser
            }),
            uniqueAssetsResolver: new UniqueResolver()
        });
    };

    return new ExportContentEntries({
        createCmsEntryZipper
    });
};
