import { makeAutoObservable, runInAction } from "mobx";
import { FileItem } from "@webiny/app-admin/types";
import { EditFileUsingUrlRepository } from "./EditFileUsingUrlRepository";
import { LOADING_STATE } from "./Loading";

const loadingLabels: Record<LOADING_STATE, string> = {
    [LOADING_STATE.IDLE]: "",
    [LOADING_STATE.ERROR]: "ERROR",
    [LOADING_STATE.GET_FILE]: "Loading file details...",
    [LOADING_STATE.UPDATE_FILE]: "Saving file details..."
};

export class EditFileUsingUrlPresenter {
    private repository: EditFileUsingUrlRepository;
    private isOpened = false;
    private file: FileItem | undefined = undefined;

    constructor(repository: EditFileUsingUrlRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    get vm() {
        const loading = this.repository.getLoading();
        const label = loadingLabels[loading.state];

        return {
            loading: loading.isLoading,
            loadingMessage: loading.isLoading ? label : "",
            errorMessage: label === "ERROR" ? loading.feedback : "",
            file: this.file,
            isOpened: label === "ERROR" ? false : this.isOpened
        };
    }

    loadFileFromUrl = async (url: string) => {
        this.isOpened = true;
        const file = await this.repository.loadFileByUrl(url);
        runInAction(() => {
            this.file = file;
        });
    };

    updateFile = async (file: FileItem) => {
        await this.repository.updateFile(file);
        this.closeDrawer();
    };

    closeDrawer = () => {
        this.isOpened = false;
    };
}
