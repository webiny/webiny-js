import { computed, makeAutoObservable, runInAction } from "mobx";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import type { CmsContentEntry } from "~/types.js";

interface PublishEntryDialogData {
    revisionDescription: string;
}

export const PUBLISH_ENTRY_DIALOG = "publish-entry";

import { GetEntryUseCase } from "~/features/contentEntry/getEntry/abstractions.js";
import { CreateEntryUseCase } from "~/features/contentEntry/createEntry/abstractions.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/updateEntry/abstractions.js";
import { PublishEntryUseCase } from "~/features/contentEntry/publishEntry/abstractions.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/unpublishEntry/abstractions.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/deleteEntry/abstractions.js";
import { UpdateRevisionDescriptionUseCase } from "~/features/contentEntry/updateRevisionDescription/abstractions.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import { CmsModelAccessor } from "~/features/contentEntry/abstractions.js";
import {
    ContentEntryFormPresenter as Abstraction,
    type IContentEntryFormPresenter,
    type IContentEntryFormViewModel,
    type IContentEntryFormActions
} from "./abstractions.js";

class ContentEntryFormPresenterImpl implements IContentEntryFormPresenter {
    private _entry: CmsContentEntry | null = null;
    private _form: IFormModel | null = null;
    private _loading: string | null = null;

    constructor(
        private formModelFactory: FormModelFactory.Interface,
        private cmsFormModelBuilder: CmsFormModelBuilder.Interface,
        private confirmation: Confirmation.Interface,
        private modelAccessor: CmsModelAccessor.Interface,
        private getEntryUseCase: GetEntryUseCase.Interface,
        private createEntryUseCase: CreateEntryUseCase.Interface,
        private updateEntryUseCase: UpdateEntryUseCase.Interface,
        private publishEntryUseCase: PublishEntryUseCase.Interface,
        private unpublishEntryUseCase: UnpublishEntryUseCase.Interface,
        private deleteEntryUseCase: DeleteEntryUseCase.Interface,
        private updateRevisionDescriptionUseCase: UpdateRevisionDescriptionUseCase.Interface
    ) {
        makeAutoObservable<
            ContentEntryFormPresenterImpl,
            | "formModelFactory"
            | "cmsFormModelBuilder"
            | "confirmation"
            | "modelAccessor"
            | "getEntryUseCase"
            | "createEntryUseCase"
            | "updateEntryUseCase"
            | "publishEntryUseCase"
            | "unpublishEntryUseCase"
            | "deleteEntryUseCase"
            | "updateRevisionDescriptionUseCase"
        >(this, {
            formModelFactory: false,
            cmsFormModelBuilder: false,
            confirmation: false,
            modelAccessor: false,
            getEntryUseCase: false,
            createEntryUseCase: false,
            updateEntryUseCase: false,
            publishEntryUseCase: false,
            unpublishEntryUseCase: false,
            deleteEntryUseCase: false,
            updateRevisionDescriptionUseCase: false,
            vm: computed
        });
    }

    private get model() {
        return this.modelAccessor.getModel();
    }

    get vm(): IContentEntryFormViewModel {
        const entry = this._entry;
        const meta = entry?.meta;
        const isLocked = meta?.locked ?? false;
        const status = meta?.status;

        return {
            loading: this._loading,
            model: this.model,
            entry: this._entry,
            form: this._form?.vm ?? null,
            canSave: !isLocked && this._form !== null,
            canPublish: this._entry !== null && status !== "published",
            canUnpublish: this._entry !== null && status === "published",
            canDelete: this._entry !== null,
            isNewEntry: this._entry === null && this._form !== null,
            isDirty: this._form?.isDirty ?? false
        };
    }

    actions: IContentEntryFormActions = {
        save: async () => {
            if (!this._form) {
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
                        model: this.model,
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
                        model: this.model,
                        data: data as Record<string, unknown>
                    });

                    runInAction(() => {
                        this._entry = entry;
                        this._form!.setData(entry.values);
                        this._form!.reset();
                    });
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
            if (!this._entry) {
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
                        model: this.model,
                        id: this._entry.id,
                        revisionDescription: result.revisionDescription
                    });
                }

                const entry = await this.publishEntryUseCase.execute({
                    model: this.model,
                    revisionId: this._entry.id
                });

                runInAction(() => {
                    this._entry = entry;
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

        unpublish: async () => {
            if (!this._entry) {
                return false;
            }

            this._loading = "Unpublishing...";

            try {
                const entry = await this.unpublishEntryUseCase.execute({
                    model: this.model,
                    revisionId: this._entry.id
                });

                runInAction(() => {
                    this._entry = entry;
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

        deleteEntry: async () => {
            if (!this._entry) {
                return false;
            }

            this._loading = "Deleting...";

            try {
                await this.deleteEntryUseCase.execute({
                    model: this.model,
                    id: this._entry.id
                });

                runInAction(() => {
                    this._entry = null;
                    this._form = null;
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

        updateRevisionDescription: async (description: string) => {
            if (!this._entry) {
                return false;
            }

            try {
                const entry = await this.updateRevisionDescriptionUseCase.execute({
                    model: this.model,
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

    async loadEntry(entryId: string): Promise<void> {
        this._loading = "Loading entry...";

        try {
            const entry = await this.getEntryUseCase.execute({
                model: this.model,
                id: entryId
            });

            runInAction(() => {
                this._entry = entry;
                this.buildAndPopulateForm(entry);
            });
        } finally {
            runInAction(() => {
                this._loading = null;
            });
        }
    }

    newEntry(): void {
        this._entry = null;

        const formConfig = this.cmsFormModelBuilder.build(this.model);
        this._form = this.formModelFactory.create(formConfig);
    }

    dispose(): void {
        this._form = null;
        this._entry = null;
    }

    private buildAndPopulateForm(entry: CmsContentEntry): void {
        const formConfig = this.cmsFormModelBuilder.build(this.model);
        this._form = this.formModelFactory.create(formConfig);
        this._form.setData(entry.values);
        this._form.reset();
    }
}

export const ContentEntryFormPresenterImplementation = Abstraction.createImplementation({
    implementation: ContentEntryFormPresenterImpl,
    dependencies: [
        FormModelFactory,
        CmsFormModelBuilder,
        Confirmation,
        CmsModelAccessor,
        GetEntryUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase,
        PublishEntryUseCase,
        UnpublishEntryUseCase,
        DeleteEntryUseCase,
        UpdateRevisionDescriptionUseCase
    ]
});
