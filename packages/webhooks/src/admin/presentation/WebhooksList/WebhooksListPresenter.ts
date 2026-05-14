import { makeAutoObservable, runInAction } from "mobx";
import { ListWebhooksUseCase } from "~/admin/features/ListWebhooks/abstractions.js";
import { WebhooksListPresenter as Abstraction } from "./abstractions.js";
import type { IWebhook } from "~/admin/domain/types.js";

class WebhooksListPresenterImpl implements Abstraction.Interface {
    private loading = false;
    private error: string | null = null;
    private items: IWebhook[] = [];
    private totalCount = 0;

    constructor(private listWebhooksUseCase: ListWebhooksUseCase.Interface) {
        makeAutoObservable(this);
    }

    get vm() {
        return {
            loading: this.loading,
            error: this.error,
            items: this.items,
            totalCount: this.totalCount
        };
    }

    async load(): Promise<void> {
        runInAction(() => {
            this.loading = true;
            this.error = null;
        });

        try {
            const result = await this.listWebhooksUseCase.execute({});
            runInAction(() => {
                this.items = result.items;
                this.totalCount = result.meta.totalCount;
                this.loading = false;
            });
        } catch (e) {
            runInAction(() => {
                this.error = e instanceof Error ? e.message : String(e);
                this.loading = false;
            });
        }
    }
}

export const WebhooksListPresenter = Abstraction.createImplementation({
    implementation: WebhooksListPresenterImpl,
    dependencies: [ListWebhooksUseCase]
});
