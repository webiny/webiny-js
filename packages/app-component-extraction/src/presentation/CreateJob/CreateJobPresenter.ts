import { makeAutoObservable, runInAction } from "mobx";
import { CreateJobPresenter as PresenterAbstraction, type GatePreset } from "./abstractions.js";
import { ComponentExtractionGateway } from "~/features/gateway/abstractions.js";
import { DEFAULT_PAGE_CAP, STAGES } from "~/constants.js";

/** The stages each gate preset pauses after (spec §3). */
const PRESET_STOP_AFTER: Record<Exclude<GatePreset, "custom">, string[]> = {
    every: [...STAGES],
    urlAndPlan: ["discover", "plan"]
};

const emptyForm = () => ({
    name: "",
    siteUrl: "",
    themeId: "",
    pageCap: String(DEFAULT_PAGE_CAP),
    checkingReachability: false,
    reachability: null,
    gatePreset: "every" as GatePreset,
    stopAfter: [...STAGES] as string[]
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
        // Editing the URL invalidates the last reachability result.
        this.vm.siteUrl = value;
        this.vm.reachability = null;
    }

    setTheme(themeId: string) {
        this.vm.themeId = themeId;
    }

    setPageCap(value: string) {
        this.vm.pageCap = value;
    }

    async checkReachability(): Promise<void> {
        const url = this.vm.siteUrl.trim();
        if (!url) {
            runInAction(() => {
                this.vm.reachability = null;
            });
            return;
        }
        runInAction(() => {
            this.vm.checkingReachability = true;
        });
        try {
            const result = await this.gateway.checkReachability(url);
            runInAction(() => {
                this.vm.reachability = result;
                this.vm.checkingReachability = false;
            });
        } catch (error) {
            runInAction(() => {
                this.vm.checkingReachability = false;
                this.vm.reachability = {
                    normalizedUrl: url,
                    reachable: false,
                    status: null,
                    sitemapFound: false,
                    sitemapUrlCount: 0,
                    error: (error as Error).message
                };
            });
        }
    }

    setGatePreset(preset: GatePreset) {
        runInAction(() => {
            this.vm.gatePreset = preset;
            if (preset !== "custom") {
                this.vm.stopAfter = [...PRESET_STOP_AFTER[preset]];
            }
        });
    }

    toggleGate(stage: string) {
        runInAction(() => {
            const set = new Set(this.vm.stopAfter);
            if (set.has(stage)) {
                set.delete(stage);
            } else {
                set.add(stage);
            }
            // Any manual toggle switches the preset to Custom (spec §3).
            this.vm.stopAfter = STAGES.filter(candidate => set.has(candidate));
            this.vm.gatePreset = "custom";
        });
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
                pageCap,
                stopAfter: this.vm.stopAfter
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
