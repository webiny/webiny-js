import { IFileFetcher } from "~/tasks/utils/abstractions/FileFetcher";
import { IZipper } from "~/tasks/utils/abstractions/Zipper";
import { ISignUrl } from "~/tasks/utils/abstractions/SignedUrl";
import {
    IZipCombiner,
    IZipCombinerResolveParams,
    IZipCombinerResolveResult
} from "./abstractions/ZipCombiner";

export interface IZipCombinerParams {
    fileFetcher: IFileFetcher;
    zipper: IZipper;
    signUrl: ISignUrl;
}

export class ZipCombiner implements IZipCombiner {
    private readonly fileFetcher: IFileFetcher;
    private readonly zipper: IZipper;
    private readonly signUrl: ISignUrl;

    public constructor(params: IZipCombinerParams) {
        this.fileFetcher = params.fileFetcher;
        this.zipper = params.zipper;
        this.signUrl = params.signUrl;
    }

    public async resolve(params: IZipCombinerResolveParams): Promise<IZipCombinerResolveResult> {
        const { source, isCloseToTimeout, isAborted } = params;

        const files = await this.fileFetcher.list(source);
        if (files.length === 0) {
            throw new Error(`No files found in with prefix "${source}".`);
        }

        let nextFile: string | undefined = undefined;

        const addFile = async () => {
            /**
             * If task is aborted, abort the zipper.
             */
            if (isAborted()) {
                this.zipper.abort();
                return;
            }
            /**
             * In case we are close to timeout, finalize the zipper.
             * We will finalize current file and return the point from which the files get processed on next run.
             */
            //
            else if (isCloseToTimeout()) {
                const file = files.shift();
                nextFile = file?.key;
                await this.zipper.finalize();
                return;
            }

            const file = files.shift();
            if (!file) {
                await this.zipper.finalize();
                return;
            }

            const result = await this.fileFetcher.fetch(file.key);
            if (!result) {
                console.error(`Failed to fetch file "${file.key}".`);
                await addFile();
                return;
            }
            await this.zipper.add(result, {
                name: file.name
            });
        };

        this.zipper.on("entry", () => {
            addFile();
        });

        addFile();

        const result = await this.zipper.done();
        if (!result.Key) {
            throw new Error(`Failed to combine files with prefix "${source}".`);
        }

        const signedUrl = await this.signUrl.fetch({
            key: result.Key
        });

        return {
            next: nextFile,
            key: signedUrl.key,
            url: signedUrl.url,
            bucket: signedUrl.bucket,
            expiresOn: signedUrl.expiresOn
        };
    }
}
