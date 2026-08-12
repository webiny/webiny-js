import { makeAutoObservable, runInAction } from "mobx";
import { CreateJobPresenter as PresenterAbstraction } from "./abstractions.js";
import { ComponentExtractionGateway } from "~/features/gateway/abstractions.js";
import { DEFAULT_PAGE_CAP } from "~/constants.js";

const emptyForm = () => ({
    name: "",
    siteUrl: "",
    themeId: "",
    pageCap: String(DEFAULT_PAGE_CAP)
});

class CreateJobPresenterImpl implements PresenterAbstraction.Interface {
    vm: PresenterAbstraction.ViewModel = {
        ...emptyForm(),
        themes: [],
        loadingThemes: false,
        creating: false,
        error: null
    };

    constructor(private gateway: ComponentExtractionGateway.Interface) {
        makeAutoObservable(this);
    }

    async init() {
        runInAction(() => {
            this.vm.loadingThemes = true;
            this.vm.error = null;
        });
        try {
            const themes = await this.gateway.listThemes();
            runInAction(() => {
                this.vm.themes = themes;
                this.vm.loadingThemes = false;
            });
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
                this.vm.loadingThemes = false;
            });
        }
    }

    setName(value: string) {
        this.vm.name = value;
    }

    setSiteUrl(value: string) {
        this.vm.siteUrl = value;
    }

    setTheme(themeId: string) {
        this.vm.themeId = themeId;
    }

    setPageCap(value: string) {
        this.vm.pageCap = value;
    }

    async create(): Promise<string> {
        const name = this.vm.name.trim();
        const siteUrl = this.vm.siteUrl.trim();
        const theme = this.vm.themes.find(candidate => candidate.id === this.vm.themeId);

        if (!name) {
            throw new Error("Give the extraction a name.");
        }
        if (!siteUrl) {
            throw new Error("Enter the site URL to crawl.");
        }
        if (!theme) {
            throw new Error("Choose the theme to bind generated components to.");
        }

        // The theme's revision id is `entryId#version`; the API wants the two apart.
        const themeEntryId = theme.id.split("#")[0];
        const parsedPageCap = Number.parseInt(this.vm.pageCap, 10);
        const pageCap = Number.isFinite(parsedPageCap) ? parsedPageCap : DEFAULT_PAGE_CAP;

        runInAction(() => {
            this.vm.creating = true;
            this.vm.error = null;
        });

        try {
            const job = await this.gateway.createJob({
                name,
                siteUrl,
                themeEntryId,
                themeVersion: theme.version,
                pageCap
            });
            const run = await this.gateway.createRun(job.id);
            runInAction(() => {
                this.vm.creating = false;
            });
            return run.id;
        } catch (error) {
            runInAction(() => {
                this.vm.creating = false;
                this.vm.error = (error as Error).message;
            });
            throw error;
        }
    }

    reset() {
        runInAction(() => {
            Object.assign(this.vm, emptyForm());
            this.vm.error = null;
            this.vm.creating = false;
        });
    }
}

export const CreateJobPresenter = PresenterAbstraction.createImplementation({
    implementation: CreateJobPresenterImpl,
    dependencies: [ComponentExtractionGateway]
});
