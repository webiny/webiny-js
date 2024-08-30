import { IImportFromUrlContentEntriesInputDownloadValues } from "~/tasks/domain/abstractions/ImportFromUrlContentEntries";
import { ICmsImportExportValidatedCombinedContentFile } from "~/types";
import { ICreateUploadCallable, IUpload } from "~/tasks/utils/upload";
import {
    IDownloadFileFromUrl,
    IDownloadFileFromUrlProcessOnIterationCallable,
    IDownloadFileFromUrlProcessResponseType
} from "./abstractions/DownloadFileFromUrl";
import { createSizeSegments } from "~/tasks/utils/helpers/sizeSegments";
import { convertFromUrlToPathname } from "~/tasks/domain/utils/convertFromUrlToPathname";
import { EXPORT_BASE_PATH, IMPORT_BASE_PATH } from "~/tasks/constants";

interface DownloadFileFromUrlFile {
    url: string;
    key: string;
    size: number;
}

interface IRange {
    start: number;
    end: number;
}

export interface IDownloadFileFromUrlParams {
    file: Pick<ICmsImportExportValidatedCombinedContentFile, "get" | "size">;
    fetch: typeof fetch;
    createUpload: ICreateUploadCallable;
    input?: IImportFromUrlContentEntriesInputDownloadValues;
}

export class DownloadFileFromUrl implements IDownloadFileFromUrl {
    private readonly file: DownloadFileFromUrlFile;
    private readonly upload: IUpload;
    private readonly fetch: typeof fetch;
    private next: number;
    private readonly ranges: IRange[];

    public constructor(params: IDownloadFileFromUrlParams) {
        const { input } = params;
        this.file = convertFromUrlToPathname({
            url: params.file.get,
            size: params.file.size
        });
        this.fetch = params.fetch;
        this.next = input?.current === undefined ? 0 : input.current;
        this.upload = params.createUpload(
            this.file.key.replace(EXPORT_BASE_PATH, IMPORT_BASE_PATH)
        );
        this.ranges = createSizeSegments(this.file.size, "1MB");
    }

    public async process<T extends string>(
        onIteration: IDownloadFileFromUrlProcessOnIterationCallable<T>
    ): Promise<IDownloadFileFromUrlProcessResponseType<T>> {
        let iteration = 0;

        while (true) {
            const next = this.ranges[this.next];

            if (this.isDone() || !next) {
                await this.upload.done();
                return "done";
            }
            let status: IDownloadFileFromUrlProcessResponseType<T> | undefined = undefined;
            await onIteration({
                iteration,
                next: this.next,
                stop: input => {
                    status = input;
                }
            });
            if (status) {
                await this.upload.done();
                return status;
            }
            iteration++;

            const headers = new Headers();

            if (this.ranges.length > 1) {
                headers.set("Range", `bytes=${next.start}-${next.end}`);
            }

            const result = await this.fetch(this.file.url, {
                method: "GET",
                keepalive: true,
                mode: "cors",
                headers
            });
            if (!result.ok) {
                throw new Error(`Failed to fetch URL: ${this.file.url}`);
            } else if (!result.body) {
                throw new Error(`Body not found for URL: ${this.file.url}`);
            }

            const reader = result.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }

                this.upload.stream.push(value);
            }

            reader.releaseLock();
            this.next++;
        }
    }

    public async abort(): Promise<void> {
        await this.upload.abort();
    }

    public getNext(): number {
        return this.next;
    }

    public isDone(): boolean {
        return !this.ranges[this.next];
    }
}

export const createDownloadFileFromUrl = (
    params: IDownloadFileFromUrlParams
): IDownloadFileFromUrl => {
    return new DownloadFileFromUrl(params);
};
