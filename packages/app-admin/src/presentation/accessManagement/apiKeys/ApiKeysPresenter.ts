import { makeAutoObservable, runInAction, computed } from "mobx";
import { ListPresenter } from "~/presentation/listPresenter/abstractions.js";
import type { ApiKey } from "~/features/accessManagement/types.js";
import {
    ListApiKeysUseCase,
    ApiKeysListCache
} from "~/features/accessManagement/apiKeys/listApiKeys/abstractions.js";
import { GetApiKeyUseCase } from "~/features/accessManagement/apiKeys/getApiKey/abstractions.js";
import { CreateApiKeyUseCase } from "~/features/accessManagement/apiKeys/createApiKey/abstractions.js";
import { UpdateApiKeyUseCase } from "~/features/accessManagement/apiKeys/updateApiKey/abstractions.js";
import { DeleteApiKeyUseCase } from "~/features/accessManagement/apiKeys/deleteApiKey/abstractions.js";
import {
    ApiKeysPresenter as Abstraction,
    type IApiKeysPresenter,
    type IApiKeysPresenterViewModel
} from "./abstractions.js";
import { ApiKeysDataSource } from "./ApiKeysDataSource.js";

class ApiKeysPresenterImpl implements IApiKeysPresenter {
    private _selectedApiKey: ApiKey | null = null;
    private _loading = false;
    private _saving = false;
    private _showForm = false;

    constructor(
        private _listPresenter: ListPresenter.Interface<ApiKey>,
        private listApiKeysUseCase: ListApiKeysUseCase.Interface,
        private getApiKeyUseCase: GetApiKeyUseCase.Interface,
        private createApiKeyUseCase: CreateApiKeyUseCase.Interface,
        private updateApiKeyUseCase: UpdateApiKeyUseCase.Interface,
        private deleteApiKeyUseCase: DeleteApiKeyUseCase.Interface,
        private cache: ApiKeysListCache.Interface
    ) {
        makeAutoObservable<
            ApiKeysPresenterImpl,
            | "listApiKeysUseCase"
            | "getApiKeyUseCase"
            | "createApiKeyUseCase"
            | "updateApiKeyUseCase"
            | "deleteApiKeyUseCase"
            | "cache"
        >(this, {
            listApiKeysUseCase: false,
            getApiKeyUseCase: false,
            createApiKeyUseCase: false,
            updateApiKeyUseCase: false,
            deleteApiKeyUseCase: false,
            cache: false,
            vm: computed
        });
    }

    get vm(): IApiKeysPresenterViewModel {
        return {
            selectedApiKey: this._selectedApiKey,
            loading: this._loading,
            saving: this._saving,
            showForm: this._showForm
        };
    }

    get list(): ListPresenter.Interface<ApiKey> {
        return this._listPresenter;
    }

    init(): void {
        const dataSource = new ApiKeysDataSource(this.listApiKeysUseCase, this.cache);

        this._listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 1000
        });
    }

    async selectApiKey(id: string): Promise<void> {
        runInAction(() => {
            this._loading = true;
            this._showForm = true;
        });

        try {
            const apiKey = await this.getApiKeyUseCase.execute(id);
            runInAction(() => {
                this._selectedApiKey = apiKey;
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    createNew(): void {
        this._selectedApiKey = null;
        this._showForm = true;
    }

    deselect(): void {
        this._selectedApiKey = null;
        this._showForm = false;
    }

    async save(data: Record<string, any>): Promise<ApiKey | null> {
        runInAction(() => {
            this._saving = true;
        });

        try {
            const isUpdate = this._selectedApiKey !== null && this._selectedApiKey.createdOn;

            if (isUpdate) {
                const apiKey = await this.updateApiKeyUseCase.execute(this._selectedApiKey!.id, {
                    name: data.name,
                    description: data.description,
                    permissions: data.permissions
                });
                runInAction(() => {
                    this._selectedApiKey = apiKey;
                });
                return apiKey;
            } else {
                const apiKey = await this.createApiKeyUseCase.execute({
                    name: data.name,
                    slug: data.slug,
                    description: data.description,
                    permissions: data.permissions
                });
                runInAction(() => {
                    this._selectedApiKey = apiKey;
                });
                return apiKey;
            }
        } catch {
            return null;
        } finally {
            runInAction(() => {
                this._saving = false;
            });
        }
    }

    async deleteApiKey(id: string): Promise<void> {
        await this.deleteApiKeyUseCase.execute(id);

        runInAction(() => {
            if (this._selectedApiKey !== null && this._selectedApiKey.id === id) {
                this._selectedApiKey = null;
                this._showForm = false;
            }
        });
    }
}

export const ApiKeysPresenterImplementation = Abstraction.createImplementation({
    implementation: ApiKeysPresenterImpl,
    dependencies: [
        ListPresenter,
        ListApiKeysUseCase,
        GetApiKeyUseCase,
        CreateApiKeyUseCase,
        UpdateApiKeyUseCase,
        DeleteApiKeyUseCase,
        ApiKeysListCache
    ]
});
