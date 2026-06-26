import { computed, makeAutoObservable, runInAction } from "mobx";
import { FormModelFactory, FormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
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
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import { ContentEntryFormPresenter as Abstraction } from "./abstractions.js";
import { TRASH_ENTRY_DIALOG } from "~/presentation/contentEntries/list/ContentEntriesPresenter.js";

class ContentEntryFormPresenterImpl implements Abstraction.Interface {
    private entry: CmsContentEntry | null = null;
    private form: FormModel.Interface | null = null;
    private loading: string | null = null;
    private folderId: string | null = null;

    constructor(
        private formModelFactory: FormModelFactory.Interface,
        private cmsFormModelBuilder: CmsFormModelBuilder.Interface,
        private confirmation: Confirmation.Interface,
        private modelAccessor: CmsModelContext.Interface,
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

    get vm(): Abstraction.ViewModel {
        const entry = this.entry;
        const meta = entry?.meta;
        const isLocked = meta?.locked ?? false;
        const status = meta?.status;

        return {
            loading: this.loading,
            model: this.model,
            entry: this.entry,
            form: this.form?.vm ?? null,
            canSave: !isLocked && this.form !== null,
            canPublish: this.entry !== null && status !== "published",
            canUnpublish: this.entry !== null && status === "published",
            canDelete: this.entry !== null,
            isNewEntry: this.entry === null && this.form !== null,
            isDirty: this.form?.isDirty ?? false
        };
    }

    async saveRevision(options?: { skipValidation?: boolean }): Promise<boolean> {
        if (!this.form) {
            return false;
        }

        const skipValidation = options?.skipValidation ?? true;
        const data = await this.form.submit({ skipValidation });

        if (!data) {
            return false;
        }

        runInAction(() => {
            this.loading = "Saving...";
        });

        try {
            if (this.entry) {
                const entry = await this.updateEntryUseCase.execute({
                    model: this.model,
                    revisionId: this.entry.id,
                    data: {
                        values: data
                    },
                    options: { skipValidation }
                });

                runInAction(() => {
                    this.entry = entry;
                    this.form!.setData(entry.values);
                    this.form!.reset();
                });
            } else {
                const createData: Record<string, unknown> = { values: data };
                if (this.folderId) {
                    createData.wbyAco_location = { folderId: this.folderId };
                }

                const entry = await this.createEntryUseCase.execute({
                    model: this.model,
                    data: createData,
                    options: { skipValidation }
                });

                runInAction(() => {
                    this.entry = entry;
                    this.form!.setData(entry.values);
                    this.form!.reset();
                });
            }

            return true;
        } catch {
            return false;
        } finally {
            runInAction(() => {
                this.loading = null;
            });
        }
    }

    async publishRevision(): Promise<boolean> {
        if (!this.entry) {
            return false;
        }

        const result = await this.confirmation.confirm<PublishEntryDialogData>(
            PUBLISH_ENTRY_DIALOG,
            { entry: this.entry }
        );

        if (result === false) {
            return false;
        }

        runInAction(() => {
            this.loading = "Publishing...";
        });

        try {
            if (result.revisionDescription) {
                await this.updateRevisionDescriptionUseCase.execute({
                    model: this.model,
                    id: this.entry.id,
                    revisionDescription: result.revisionDescription
                });
            }

            const entry = await this.publishEntryUseCase.execute({
                model: this.model,
                revisionId: this.entry.id
            });

            runInAction(() => {
                this.entry = entry;
            });

            return true;
        } catch {
            return false;
        } finally {
            runInAction(() => {
                this.loading = null;
            });
        }
    }

    async unpublishRevision(): Promise<boolean> {
        if (!this.entry) {
            return false;
        }

        this.loading = "Unpublishing...";

        try {
            const entry = await this.unpublishEntryUseCase.execute({
                model: this.model,
                revisionId: this.entry.id
            });

            runInAction(() => {
                this.entry = entry;
            });

            return true;
        } catch {
            return false;
        } finally {
            runInAction(() => {
                this.loading = null;
            });
        }
    }

    async deleteEntry(): Promise<boolean> {
        if (!this.entry) {
            return false;
        }

        const model = this.model;
        const entry = this.entry;

        return this.confirmation.confirm(
            TRASH_ENTRY_DIALOG,
            { entryId: entry.entryId },
            async () => {
                try {
                    await this.deleteEntryUseCase.execute({
                        model,
                        id: entry.entryId
                    });

                    runInAction(() => {
                        this.entry = null;
                        this.form = null;
                    });

                    return true;
                } catch {
                    return false;
                }
            }
        );
    }

    async loadRevision(id: string): Promise<void> {
        this.loading = "Loading entry...";

        try {
            const entry = await this.getEntryUseCase.execute({
                model: this.model,
                id
            });

            runInAction(() => {
                this.entry = entry;
                this.buildAndPopulateForm(entry);
            });
        } finally {
            runInAction(() => {
                this.loading = null;
            });
        }
    }

    setFolderId(folderId: string | null): void {
        this.folderId = folderId;
    }

    newEntry(): void {
        this.entry = null;

        const formConfig = this.cmsFormModelBuilder.build(this.model);
        this.form = this.formModelFactory.create(formConfig);
    }

    reset(): void {
        this.form = null;
        this.entry = null;
    }

    private buildAndPopulateForm(entry: CmsContentEntry): void {
        const formConfig = this.cmsFormModelBuilder.build(this.model);
        this.form = this.formModelFactory.create(formConfig);
        this.form.setData(entry.values);
        this.form.reset();
    }
}

export const ContentEntryFormPresenter = Abstraction.createImplementation({
    implementation: ContentEntryFormPresenterImpl,
    dependencies: [
        FormModelFactory,
        CmsFormModelBuilder,
        Confirmation,
        CmsModelContext,
        GetEntryUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase,
        PublishEntryUseCase,
        UnpublishEntryUseCase,
        DeleteEntryUseCase,
        UpdateRevisionDescriptionUseCase
    ]
});
