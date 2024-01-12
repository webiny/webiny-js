import { makeAutoObservable, runInAction } from "mobx";
import { FileItem } from "@webiny/app-admin/types";
import { EditFileUsingUrlRepository } from "./EditFileUsingUrlRepository";

export class EditFileUsingUrlPresenter {
    private repository: EditFileUsingUrlRepository;
    private file: FileItem | undefined;
    private isOpened = false;
    private loading = false;

    constructor(repository: EditFileUsingUrlRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    get vm() {
        return {
            loading: this.loading,
            file: this.file,
            isOpened: this.isOpened
        };
    }

    loadFileFromUrl = async (url: string) => {
        this.loading = true;
        const file = await this.repository.getFileByUrl(url);
        runInAction(() => {
            this.file = file;
            this.loading = false;
            this.isOpened = true;
        });
    };

    closeDrawer = () => {
        this.isOpened = false;
    };
}
