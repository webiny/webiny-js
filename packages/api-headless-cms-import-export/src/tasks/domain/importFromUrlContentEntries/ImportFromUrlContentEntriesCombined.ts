import {
    IImportFromUrlContentEntriesInputValues,
    IImportFromUrlContentEntriesValues
} from "~/tasks/domain/abstractions/ImportFromUrlContentEntries";
import { ICmsImportExportValidatedCombinedContentFile } from "~/types";
import { ICreateUploadCallable, IUpload } from "~/tasks/utils/upload";
import { IImportFromUrlContentEntriesCombined } from "./abstractions/ImportFromUrlContentEntriesCombined";
import path from "path";
import { WebinyError } from "@webiny/error";

const defaultValues: IImportFromUrlContentEntriesInputValues = {
    start: -1,
    end: -1,
    length: -1
};

interface ImportFromUrlContentEntriesCombinedFile {
    url: string;
    key: string;
    size: number;
}

export interface IImportFromUrlContentEntriesCombinedParams {
    file: Pick<ICmsImportExportValidatedCombinedContentFile, "get" | "size">;
    fetch: typeof fetch;
    createUpload: ICreateUploadCallable;
    input?: IImportFromUrlContentEntriesInputValues;
}

export class ImportFromUrlContentEntriesCombined implements IImportFromUrlContentEntriesCombined {
    private readonly file: ImportFromUrlContentEntriesCombinedFile;
    private values: IImportFromUrlContentEntriesInputValues;
    private readonly upload: IUpload;
    private readonly fetch: typeof fetch;

    public constructor(params: IImportFromUrlContentEntriesCombinedParams) {
        this.file = this.createFile(params.file);
        this.fetch = params.fetch;
        this.values = params.input || defaultValues;
        this.upload = params.createUpload(this.file.key);
    }

    public async process(): Promise<void> {
        if (this.isDone()) {
            await this.upload.done();
            return;
        }

        const headers = new Headers();

        headers.set("Range", `bytes=${this.values.start + 1}-${this.values.end + 1}`);

        const result = await this.fetch(this.file.url, {
            method: "GET",
            keepalive: true,
            mode: "cors",
            headers
        });
        if (!result.ok) {
            throw new Error(`Failed to fetch URL: ${this.file.url}`);
        } else if (!result.body) {
            console.log(result);
            throw new Error(`Body not found for URL: ${this.file.url}`);
        }

        const reader = result.body.getReader();

        // const passOn = async () => {
        //     const { done, value } = await reader.read();
        //     if (done) {
        //         return;
        //     }
        //     this.upload.stream.push(value);
        //     await passOn();
        // };
        //
        // await passOn();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            this.upload.stream.push(value);
        }

        reader.releaseLock();
    }

    public async abort(): Promise<void> {
        await this.upload.abort();
    }

    public getValues(): IImportFromUrlContentEntriesValues {
        return {
            ...this.values,
            done: this.isDone()
        };
    }

    public isDone() {
        if (this.values.start < 0) {
            return false;
        }
        return this.values.start >= this.values.length - 1;
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
