import { makeAutoObservable, runInAction, computed } from "mobx";
import slugify from "slugify";
import { ListPresenter } from "~/presentation/listPresenter/abstractions.js";
import { FormModelFactory } from "~/features/formModel/abstractions.js";
import type { IFormModel } from "~/features/formModel/abstractions.js";
import type { ApiKey } from "~/features/accessManagement/types.js";
import {
    ListApiKeysUseCase,
    ApiKeysListCache
} from "~/features/accessManagement/apiKeys/listApiKeys/abstractions.js";
import { GetApiKeyUseCase } from "~/features/accessManagement/apiKeys/getApiKey/abstractions.js";
import { CreateApiKeyUseCase } from "~/features/accessManagement/apiKeys/createApiKey/abstractions.js";
import { UpdateApiKeyUseCase } from "~/features/accessManagement/apiKeys/updateApiKey/abstractions.js";
import { DeleteApiKeyUseCase } from "~/features/accessManagement/apiKeys/deleteApiKey/abstractions.js";
import { ApiKeysPresenter as Abstraction } from "./abstractions.js";
import { ApiKeysDataSource } from "./ApiKeysDataSource.js";

class ApiKeysPresenterImpl implements Abstraction.Interface {
    private _selectedApiKey: ApiKey | null = null;
    private _loading = false;
    private _saving = false;
    private _showForm = false;
    private _form: IFormModel;

    constructor(
        private _listPresenter: ListPresenter.Interface<ApiKey>,
        private formModelFactory: FormModelFactory.Interface,
        private listApiKeysUseCase: ListApiKeysUseCase.Interface,
        private getApiKeyUseCase: GetApiKeyUseCase.Interface,
        private createApiKeyUseCase: CreateApiKeyUseCase.Interface,
        private updateApiKeyUseCase: UpdateApiKeyUseCase.Interface,
        private deleteApiKeyUseCase: DeleteApiKeyUseCase.Interface,
        private cache: ApiKeysListCache.Interface
    ) {
        this._form = this.buildForm(true, "new");
        makeAutoObservable<
            ApiKeysPresenterImpl,
            | "formModelFactory"
            | "listApiKeysUseCase"
            | "getApiKeyUseCase"
            | "createApiKeyUseCase"
            | "updateApiKeyUseCase"
            | "deleteApiKeyUseCase"
            | "cache"
        >(this, {
            formModelFactory: false,
            listApiKeysUseCase: false,
            getApiKeyUseCase: false,
            createApiKeyUseCase: false,
            updateApiKeyUseCase: false,
            deleteApiKeyUseCase: false,
            cache: false,
            vm: computed
        });
    }

    get vm(): Abstraction.ViewModel {
        return {
            selectedApiKey: this._selectedApiKey,
            loading: this._loading,
            saving: this._saving,
            showForm: this._showForm,
            form: this._form.vm
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
                this._form = this.buildForm(false, apiKey.id);
                this._form.setData({
                    name: apiKey.name,
                    slug: apiKey.slug,
                    description: apiKey.description,
                    token: apiKey.token,
                    permissions: apiKey.permissions || []
                });
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    createNew(): void {
        this._selectedApiKey = null;
        this._form = this.buildForm(true, "new");
        this._showForm = true;
    }

    deselect(): void {
        this._selectedApiKey = null;
        this._showForm = false;
    }

    async save(): Promise<ApiKey | null> {
        const data = await this._form.submit<ApiKey>();
        if (!data) {
            return null;
        }

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
                    this._form = this.buildForm(false, apiKey.id);
                    this._form.setData({
                        name: apiKey.name,
                        slug: apiKey.slug,
                        description: apiKey.description,
                        permissions: apiKey.permissions || []
                    });
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

    private buildForm(isNew: boolean, entityId: string): IFormModel {
        return this.formModelFactory.create({
            fields: fields => ({
                name: fields
                    .text()
                    .label("Name")
                    .required("Name is required.")
                    .onBlur((value, form) => {
                        const slugValue = form.field("slug").getValue();
                        if (slugValue || !value) {
                            return;
                        }
                        form.field("slug").setValue(
                            slugify(String(value), {
                                replacement: "-",
                                lower: true,
                                remove: /[*#?<>_{}[\]+~.()'"!:;@]/g,
                                trim: false
                            })
                        );
                    }),
                slug: fields.text().label("Slug").required("Slug is required.").disabled(!isNew),
                description: fields
                    .text()
                    .label("Description")
                    .required("Description is required.")
                    .renderer("textarea"),
                // @ts-expect-error This is a single-use local renderer I don't want to be visible to users.
                token: fields.text().label("Token").renderer("apiKeyToken"),
                permissions: fields
                    .permissions()
                    .label("Permissions")
                    .renderer("permissions", { id: entityId })
            }),
            layout: layout => [
                layout.row("name", "slug"),
                layout.row("description"),
                layout.row("token"),
                layout.row("permissions")
            ]
        });
    }
}

export const ApiKeysPresenterImplementation = Abstraction.createImplementation({
    implementation: ApiKeysPresenterImpl,
    dependencies: [
        ListPresenter,
        FormModelFactory,
        ListApiKeysUseCase,
        GetApiKeyUseCase,
        CreateApiKeyUseCase,
        UpdateApiKeyUseCase,
        DeleteApiKeyUseCase,
        ApiKeysListCache
    ]
});
