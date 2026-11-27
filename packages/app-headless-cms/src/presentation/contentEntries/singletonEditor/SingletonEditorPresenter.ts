import { makeAutoObservable, runInAction } from "mobx";
import { RouterRepository } from "@webiny/app/features/router/abstractions.js";
import type { CmsModel } from "~/types.js";
import { Routes } from "~/routes.js";
import { GetLatestSingletonEntryUseCase } from "~/features/contentEntry/singletonEditor/getLatest/abstractions.js";
import { SingletonEditorPresenter as Abstraction } from "./abstractions.js";

class SingletonEditorPresenterImpl implements Abstraction.Interface {
    private entryId: string | null = null;
    private loading = false;
    private error: string | null = null;
    private hasFields = true;
    private initToken = 0;

    constructor(
        private readonly router: RouterRepository.Interface,
        private readonly getLatestSingletonEntryUseCase: GetLatestSingletonEntryUseCase.Interface
    ) {
        makeAutoObservable<
            SingletonEditorPresenterImpl,
            "router" | "getLatestSingletonEntryUseCase" | "initToken"
        >(this, {
            router: false,
            getLatestSingletonEntryUseCase: false,
            initToken: false
        });
    }

    get vm(): Abstraction.ViewModel {
        return {
            entryId: this.entryId,
            loading: this.loading,
            error: this.error,
            hasFields: this.hasFields
        };
    }

    async init(model: CmsModel, routeEntryId: string | undefined): Promise<void> {
        const token = ++this.initToken;
        this.hasFields = model.fields.length > 0;
        this.error = null;
        this.loading = false;

        if (!this.hasFields) {
            this.entryId = null;
            return;
        }

        if (routeEntryId) {
            this.entryId = routeEntryId;
            return;
        }

        this.loading = true;
        let result: Awaited<ReturnType<GetLatestSingletonEntryUseCase.Interface["execute"]>>;
        try {
            result = await this.getLatestSingletonEntryUseCase.execute(model);
        } catch (error) {
            if (token !== this.initToken) {
                return;
            }
            runInAction(() => {
                this.error = error instanceof Error ? error.message : String(error);
                this.loading = false;
            });
            return;
        }

        if (token !== this.initToken) {
            return;
        }

        if (result.isFail()) {
            runInAction(() => {
                this.error = result.error.message;
                this.loading = false;
            });
            return;
        }

        const entry = result.value;
        runInAction(() => {
            this.entryId = entry.id;
            this.loading = false;
        });
        this.router.replaceRoute(Routes.ContentEntries.List, {
            modelId: model.modelId,
            id: entry.id
        });
    }

    dispose(): void {
        this.initToken++;
        this.entryId = null;
        this.loading = false;
        this.error = null;
        this.hasFields = true;
    }
}

export const SingletonEditorPresenter = Abstraction.createImplementation({
    implementation: SingletonEditorPresenterImpl,
    dependencies: [RouterRepository, GetLatestSingletonEntryUseCase]
});
