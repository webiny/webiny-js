import type {
    IDeleteFiles,
    IDeleteFilesExecuteInput
} from "~/tasks/utils/deleteFiles/abstractions/DeleteFiles";
import { createS3Client } from "../helpers/s3Client";
import { FileFetcher } from "~/tasks/utils/fileFetcher";
import type { IFileFetcher } from "~/tasks/utils/fileFetcher";
import { getBucket } from "../helpers/getBucket";

export interface IDeleteFilesParams {
    fileFetcher: IFileFetcher;
}

export class DeleteFiles implements IDeleteFiles {
    private readonly fileFetcher: IFileFetcher;

    public constructor(params: IDeleteFilesParams) {
        this.fileFetcher = params.fileFetcher;
    }

    public async execute(input: IDeleteFilesExecuteInput): Promise<void> {
        if (!input) {
            return;
        }
        const files = (Array.isArray(input) ? input : [input]).filter((file): file is string => {
            return !!file;
        });
        for (const file of files) {
            const exists = await this.fileFetcher.exists(file);
            if (!exists) {
                continue;
            }
            try {
                const result = await this.fileFetcher.delete(file);
                if (!result.$metadata) {
                    continue;
                }
                if (result.$metadata.httpStatusCode !== 200) {
                    console.log(`Failed to delete file "${file}".`);
                }
            } catch (ex) {
                console.log(`Failed to delete file "${file}".`, ex);
            }
        }
    }
}

export const createDeleteFiles = (): IDeleteFiles => {
    const client = createS3Client();
    const bucket = getBucket();
    return new DeleteFiles({
        fileFetcher: new FileFetcher({
            client,
            bucket
        })
    });
};
