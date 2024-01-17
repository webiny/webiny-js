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
    private cache: Map<string, FileItem> = new Map();
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
        if (this.cache.has(url)) {
            return this.cache.get(url) as FileItem;
        }

        this.loading.startLoading(LOADING_STATE.GET_FILE);
        try {
            const file = await this.getFileByUrlGateway.execute(url);
            this.loading.stopLoadingWithSuccess();
            this.cache.set(url, file);
        } catch (err) {
            this.loading.stopLoadingWithError(err.message);
        }

        return this.cache.get(url) as FileItem;
    }

    async updateFile(input: FileItem) {
        this.loading.startLoading(LOADING_STATE.UPDATE_FILE);
        try {
            const { id, ...data } = input;
            await this.updateFileGateway.execute(id, data);
            this.loading.stopLoadingWithSuccess();
            const cacheKey = this.findCacheKey(id);
            if (cacheKey) {
                this.cache.set(cacheKey, input);
            }
        } catch (err) {
            this.loading.stopLoadingWithError(err.message);
        }
    }

    private findCacheKey(id: string) {
        const entries = this.cache.entries();
        for (const [cacheKey, file] of entries) {
            if (file.id === id) {
                return cacheKey;
            }
        }
        return undefined;
    }
}
