import { computed, makeAutoObservable, runInAction } from "mobx";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import type { CmsContentEntry, CmsContentEntryRevision, CmsModel } from "~/types.js";

interface PublishEntryDialogData {
    revisionDescription: string;
}

export const PUBLISH_ENTRY_DIALOG = "publish-entry";
export const DELETE_REVISION_DIALOG = "delete-revision";
import { GetEntryUseCase } from "~/features/contentEntry/getEntry/abstractions.js";
import { CreateEntryUseCase } from "~/features/contentEntry/createEntry/abstractions.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/updateEntry/abstractions.js";
import { PublishEntryUseCase } from "~/features/contentEntry/publishEntry/abstractions.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/unpublishEntry/abstractions.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/deleteEntry/abstractions.js";
import { DeleteEntryRevisionUseCase } from "~/features/contentEntry/deleteEntryRevision/abstractions.js";
import { CreateRevisionFromUseCase } from "~/features/contentEntry/createRevisionFrom/abstractions.js";
import { ListRevisionsUseCase } from "~/features/contentEntry/listRevisions/abstractions.js";
import { UpdateRevisionDescriptionUseCase } from "~/features/contentEntry/updateRevisionDescription/abstractions.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import {
    ContentEntryFormPresenter as Abstraction,
    type IContentEntryFormPresenter,
    type IContentEntryFormViewModel,
    type IContentEntryFormActions,
    type IContentEntryFormInitConfig
} from "./abstractions.js";

class ContentEntryFormPresenterImpl implements IContentEntryFormPresenter {
    private _model: CmsModel | null = null;
    private _entry: CmsContentEntry | null = null;
    private _form: IFormModel | null = null;
    private _revisions: CmsContentEntryRevision[] = [];
    private _activeTab = "content";
    private _loading: string | null = null;

    constructor(
        private formModelFactory: FormModelFactory.Interface,
        private cmsFormModelBuilder: CmsFormModelBuilder.Interface,
        private confirmation: Confirmation.Interface,
        private getEntryUseCase: GetEntryUseCase.Interface,
        private createEntryUseCase: CreateEntryUseCase.Interface,
        private updateEntryUseCase: UpdateEntryUseCase.Interface,
        private publishEntryUseCase: PublishEntryUseCase.Interface,
        private unpublishEntryUseCase: UnpublishEntryUseCase.Interface,
        private deleteEntryUseCase: DeleteEntryUseCase.Interface,
        private deleteEntryRevisionUseCase: DeleteEntryRevisionUseCase.Interface,
        private createRevisionFromUseCase: CreateRevisionFromUseCase.Interface,
        private listRevisionsUseCase: ListRevisionsUseCase.Interface,
        private updateRevisionDescriptionUseCase: UpdateRevisionDescriptionUseCase.Interface
    ) {
        makeAutoObservable<
            ContentEntryFormPresenterImpl,
            | "formModelFactory"
            | "cmsFormModelBuilder"
            | "confirmation"
            | "getEntryUseCase"
            | "createEntryUseCase"
            | "updateEntryUseCase"
            | "publishEntryUseCase"
            | "unpublishEntryUseCase"
            | "deleteEntryUseCase"
            | "deleteEntryRevisionUseCase"
            | "createRevisionFromUseCase"
            | "listRevisionsUseCase"
            | "updateRevisionDescriptionUseCase"
        >(this, {
            formModelFactory: false,
            cmsFormModelBuilder: false,
            confirmation: false,
            getEntryUseCase: false,
            createEntryUseCase: false,
            updateEntryUseCase: false,
            publishEntryUseCase: false,
            unpublishEntryUseCase: false,
            deleteEntryUseCase: false,
            deleteEntryRevisionUseCase: false,
            createRevisionFromUseCase: false,
            listRevisionsUseCase: false,
            updateRevisionDescriptionUseCase: false,
            vm: computed
        });
    }

    get vm(): IContentEntryFormViewModel {
        const entry = this._entry;
        const meta = entry?.meta;
        const isLocked = meta?.locked ?? false;
        const status = meta?.status;

        return {
            loading: this._loading,
            entry: this._entry,
            form: this._form?.vm ?? null,
            revisions: this._revisions,
            activeTab: this._activeTab,
            canSave: !isLocked && this._form !== null,
            canPublish: this._entry !== null && status !== "published",
            canUnpublish: this._entry !== null && status === "published",
            canDelete: this._entry !== null,
            canCreateRevision: this._entry !== null && isLocked,
            isNewEntry: this._entry === null && this._form !== null,
            isDirty: this._form?.isDirty ?? false
        };
    }

    actions: IContentEntryFormActions = {
        save: async () => {
            if (!this._form || !this._model) {
                return false;
            }

            const data = await this._form.submit();
            if (!data) {
                return false;
            }

            this._loading = "Saving...";

            try {
                if (this._entry) {
                    const entry = await this.updateEntryUseCase.execute({
                        model: this._model,
                        revisionId: this._entry.id,
                        data: data as Record<string, unknown>
                    });

                    runInAction(() => {
                        this._entry = entry;
                        this._form!.setData(entry.values);
                        this._form!.reset();
                    });
                } else {
                    const entry = await this.createEntryUseCase.execute({
                        model: this._model,
                        data: data as Record<string, unknown>
                    });

                    runInAction(() => {
                        this._entry = entry;
                        this._form!.setData(entry.values);
                        this._form!.reset();
                    });

                    void this.loadRevisions();
                }

                return true;
            } catch {
                return false;
            } finally {
                runInAction(() => {
                    this._loading = null;
                });
            }
        },

        publish: async () => {
            if (!this._entry || !this._model) {
                return false;
            }

            const result = await this.confirmation.confirm<PublishEntryDialogData>(
                PUBLISH_ENTRY_DIALOG,
                { entryId: this._entry.id }
            );

            if (result === false) {
                return false;
            }

            this._loading = "Publishing...";

            try {
                if (result.revisionDescription) {
                    await this.updateRevisionDescriptionUseCase.execute({
                        model: this._model,
                        id: this._entry.id,
                        revisionDescription: result.revisionDescription
                    });
                }

                const entry = await this.publishEntryUseCase.execute({
                    model: this._model,
                    revisionId: this._entry.id
                });

                runInAction(() => {
                    this._entry = entry;
                });

                void this.loadRevisions();
                return true;
            } catch {
                return false;
            } finally {
                runInAction(() => {
                    this._loading = null;
                });
            }
        },

        unpublish: async () => {
            if (!this._entry || !this._model) {
                return false;
            }

            this._loading = "Unpublishing...";

            try {
                const entry = await this.unpublishEntryUseCase.execute({
                    model: this._model,
                    revisionId: this._entry.id
                });

                runInAction(() => {
                    this._entry = entry;
                });

                void this.loadRevisions();
                return true;
            } catch {
                return false;
            } finally {
                runInAction(() => {
                    this._loading = null;
                });
            }
        },

        deleteEntry: async () => {
            if (!this._entry || !this._model) {
                return false;
            }

            this._loading = "Deleting...";

            try {
                await this.deleteEntryUseCase.execute({
                    model: this._model,
                    id: this._entry.id
                });

                runInAction(() => {
                    this._entry = null;
                    this._form = null;
                    this._revisions = [];
                });

                return true;
            } catch {
                return false;
            } finally {
                runInAction(() => {
                    this._loading = null;
                });
            }
        },

        deleteRevision: async () => {
            if (!this._entry || !this._model) {
                return false;
            }

            const model = this._model;
            const revisionId = this._entry.id;

            const confirmed = await this.confirmation.confirm(DELETE_REVISION_DIALOG, {
                revisionId
            });

            if (!confirmed) {
                return false;
            }

            this._loading = "Deleting revision...";

            try {
                await this.deleteEntryRevisionUseCase.execute({ model, revisionId });

                await this.loadRevisions();

                runInAction(() => {
                    const latestRevision = this._revisions[0];
                    if (latestRevision) {
                        void this.loadEntry({
                            model: this._model!,
                            entryId: latestRevision.id
                        });
                    } else {
                        this._entry = null;
                        this._form = null;
                    }
                });

                return true;
            } catch {
                return false;
            } finally {
                runInAction(() => {
                    this._loading = null;
                });
            }
        },

        createRevision: async () => {
            if (!this._entry || !this._model) {
                return;
            }

            this._loading = "Creating revision...";

            try {
                const entry = await this.createRevisionFromUseCase.execute({
                    model: this._model,
                    revisionId: this._entry.id
                });

                runInAction(() => {
                    this._entry = entry;
                    this.buildAndPopulateForm(entry);
                });

                void this.loadRevisions();
            } finally {
                runInAction(() => {
                    this._loading = null;
                });
            }
        },

        switchRevision: async (revisionId: string) => {
            if (!this._model) {
                return;
            }

            await this.loadEntry({ model: this._model, entryId: revisionId });
        },

        setActiveTab: (tab: string) => {
            this._activeTab = tab;
        },

        updateRevisionDescription: async (description: string) => {
            if (!this._entry || !this._model) {
                return false;
            }

            try {
                const entry = await this.updateRevisionDescriptionUseCase.execute({
                    model: this._model,
                    id: this._entry.id,
                    revisionDescription: description
                });

                runInAction(() => {
                    this._entry = entry;
                });

                return true;
            } catch {
                return false;
            }
        }
    };

    async loadEntry(config: IContentEntryFormInitConfig): Promise<void> {
        this._model = config.model;
        this._loading = "Loading entry...";

        try {
            const entry = await this.getEntryUseCase.execute({
                model: config.model,
                id: config.entryId!
            });

            runInAction(() => {
                this._entry = entry;
                this.buildAndPopulateForm(entry);
            });

            void this.loadRevisions();
        } finally {
            runInAction(() => {
                this._loading = null;
            });
        }
    }

    newEntry(config: { model: CmsModel }): void {
        this._model = config.model;
        this._entry = null;
        this._revisions = [];
        this._activeTab = "content";

        const formConfig = this.cmsFormModelBuilder.build(config.model);
        this._form = this.formModelFactory.create(formConfig);
    }

    dispose(): void {
        this._form = null;
        this._entry = null;
        this._model = null;
        this._revisions = [];
    }

    private buildAndPopulateForm(entry: CmsContentEntry): void {
        if (!this._model) {
            return;
        }

        const formConfig = this.cmsFormModelBuilder.build(this._model);
        this._form = this.formModelFactory.create(formConfig);
        this._form.setData(entry.values);
        this._form.reset();
    }

    private async loadRevisions(): Promise<void> {
        if (!this._entry || !this._model) {
            return;
        }

        try {
            const revisions = await this.listRevisionsUseCase.execute({
                model: this._model,
                entryId: this._entry.entryId
            });

            runInAction(() => {
                this._revisions = revisions;
            });
        } catch {
            // Silently fail — revisions are supplementary
        }
    }
}

export const ContentEntryFormPresenterImplementation = Abstraction.createImplementation({
    implementation: ContentEntryFormPresenterImpl,
    dependencies: [
        FormModelFactory,
        CmsFormModelBuilder,
        Confirmation,
        GetEntryUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase,
        PublishEntryUseCase,
        UnpublishEntryUseCase,
        DeleteEntryUseCase,
        DeleteEntryRevisionUseCase,
        CreateRevisionFromUseCase,
        ListRevisionsUseCase,
        UpdateRevisionDescriptionUseCase
    ]
});
