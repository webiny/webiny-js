import { IImportFromUrlContentEntriesInputDownloadValues } from "~/tasks/domain/abstractions/ImportFromUrlContentEntries";
import { ICmsImportExportValidatedCombinedContentFile } from "~/types";
import { ICreateUploadCallable, IUpload } from "~/tasks/utils/upload";
import {
    IImportFromUrlContentEntriesCombined,
    IImportFromUrlContentEntriesCombinedProcessOnIterationCallable
} from "./abstractions/ImportFromUrlContentEntriesCombined";
import path from "path";
import { WebinyError } from "@webiny/error";
import { createSizeSegments } from "~/tasks/utils/helpers/sizeSegments";

interface ImportFromUrlContentEntriesCombinedFile {
    url: string;
    key: string;
    size: number;
}

interface IRange {
    start: number;
    end: number;
}

export interface IImportFromUrlContentEntriesCombinedParams {
    file: Pick<ICmsImportExportValidatedCombinedContentFile, "get" | "size">;
    fetch: typeof fetch;
    createUpload: ICreateUploadCallable;
    input?: IImportFromUrlContentEntriesInputDownloadValues;
}

export class ImportFromUrlContentEntriesCombined implements IImportFromUrlContentEntriesCombined {
    private readonly file: ImportFromUrlContentEntriesCombinedFile;
    private readonly upload: IUpload;
    private readonly fetch: typeof fetch;
    private next: number;
    private readonly ranges: IRange[];

    public constructor(params: IImportFromUrlContentEntriesCombinedParams) {
        const { input } = params;
        this.file = this.createFile(params.file);
        this.fetch = params.fetch;
        this.next = input?.current === undefined ? 0 : input.current;
        this.upload = params.createUpload(this.file.key);
        this.ranges = createSizeSegments(this.file.size, "1MB");
    }

    public async process<T extends string>(
        onIteration: IImportFromUrlContentEntriesCombinedProcessOnIterationCallable
    ): Promise<T | null> {
        let iteration = 0;

        while (true) {
            const next = this.ranges[this.next];

            if (this.isDone() || !next) {
                await this.upload.done();
                return null;
            }
            let status: string | number | undefined = undefined;
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

            headers.set("Range", `bytes=${next.start}-${next.end}`);

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

    private createFile(
        file: Pick<ICmsImportExportValidatedCombinedContentFile, "get" | "size">
    ): ImportFromUrlContentEntriesCombinedFile {
        let pathname: string | undefined;
        try {
            pathname = new URL(file.get).pathname;
        } catch {
            pathname = path.basename(file.get);
        }
        if (!pathname) {
            throw new WebinyError({
                message: `Failed to get a file pathname from "${file.get}".`,
                code: "FAILED_TO_PARSE_FILE",
                data: {
                    file
                }
            });
        }
        return {
            url: file.get,
            key: pathname,
            size: file.size
        };
    }
}

export const createImportFromUrlContentEntriesCombined = (
    params: IImportFromUrlContentEntriesCombinedParams
): IImportFromUrlContentEntriesCombined => {
    return new ImportFromUrlContentEntriesCombined(params);
};
