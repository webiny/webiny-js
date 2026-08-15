import { makeAutoObservable, runInAction } from "mobx";
import { ExtractionListPresenter as PresenterAbstraction } from "./abstractions.js";
import { ComponentExtractionGateway } from "~/features/gateway/abstractions.js";

class ExtractionListPresenterImpl implements PresenterAbstraction.Interface {
    vm: PresenterAbstraction.ViewModel = {
        loading: false,
        items: [],
        error: null,
        startingJobId: null,
        search: "",
        statusFilter: "all",
        sort: "lastRun",
        libraryCount: 0
    };

    constructor(private gateway: ComponentExtractionGateway.Interface) {
        makeAutoObservable(this);
    }

    async init() {
        runInAction(() => {
            this.vm.loading = true;
            this.vm.error = null;
        });

        try {
            const [items, libraryNames] = await Promise.all([
                this.gateway.listJobs(),
                this.gateway.listLibraryNames().catch(() => [] as string[])
            ]);
            runInAction(() => {
                this.vm.items = items;
                this.vm.libraryCount = libraryNames.length;
                this.vm.loading = false;
            });
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
                this.vm.loading = false;
            });
        }
    }

    setSearch(search: string): void {
        runInAction(() => {
            this.vm.search = search;
        });
    }

    setStatusFilter(status: PresenterAbstraction.ViewModel["statusFilter"]): void {
        runInAction(() => {
            this.vm.statusFilter = status;
        });
    }

    setSort(sort: PresenterAbstraction.ViewModel["sort"]): void {
        runInAction(() => {
            this.vm.sort = sort;
        });
    }

    async startRun(jobId: string): Promise<string> {
        runInAction(() => {
            this.vm.startingJobId = jobId;
            this.vm.error = null;
        });

        try {
            const run = await this.gateway.createRun(jobId);
            runInAction(() => {
                this.vm.startingJobId = null;
            });
            return run.id;
        } catch (error) {
            runInAction(() => {
                this.vm.startingJobId = null;
                this.vm.error = (error as Error).message;
            });
            throw error;
        }
    }
}

export const ExtractionListPresenter = PresenterAbstraction.createImplementation({
    implementation: ExtractionListPresenterImpl,
    dependencies: [ComponentExtractionGateway]
});
