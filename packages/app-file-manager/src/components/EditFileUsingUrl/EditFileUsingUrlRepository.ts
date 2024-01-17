import { makeAutoObservable } from "mobx";
import { FileItem } from "@webiny/app-admin/types";
import { Loading, LOADING_STATE } from "./Loading";

export interface IGetFileByUrl {
    execute(url: string): Promise<FileItem>;
}

export interface IUpdateFile {
    execute(id: string, data: Partial<FileItem>): Promise<void>;
}

export class EditFileUsingUrlRepository {
    private readonly loading: Loading;
    private getFileByUrlGateway: IGetFileByUrl;
    private updateFileGateway: IUpdateFile;

    constructor(getFileByUrl: IGetFileByUrl, updateFile: IUpdateFile) {
        this.getFileByUrlGateway = getFileByUrl;
        this.updateFileGateway = updateFile;

        this.loading = new Loading();
        makeAutoObservable(this);
    }

    getLoading() {
        return this.loading;
    }

    async loadFileByUrl(url: string) {
        this.loading.startLoading(LOADING_STATE.GET_FILE);
        try {
            const file = await this.getFileByUrlGateway.execute(url);
            this.loading.stopLoadingWithSuccess();
            return file;
        } catch (err) {
            this.loading.stopLoadingWithError(err.message);
        }

        return undefined;
    }

    async updateFile(input: FileItem) {
        this.loading.startLoading(LOADING_STATE.UPDATE_FILE);
        try {
            const { id, ...data } = input;
            await this.updateFileGateway.execute(id, data);
            this.loading.stopLoadingWithSuccess();
        } catch (err) {
            this.loading.stopLoadingWithError(err.message);
        }
    }
}
