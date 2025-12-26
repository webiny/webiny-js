export type IDeleteFilesExecuteInput = string | string[] | undefined | null;

export interface IDeleteFiles {
    /**
     * This method should take a file or an array of file paths and delete them.
     * It should log errors if any occur.
     */
    execute(input: IDeleteFilesExecuteInput): Promise<void>;
}
