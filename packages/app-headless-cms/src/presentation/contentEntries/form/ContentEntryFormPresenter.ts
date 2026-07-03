import { computed, makeAutoObservable, runInAction, toJS } from "mobx";
import { FormModel, FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import type { CmsContentEntry } from "~/types.js";
import { GetEntryUseCase } from "~/features/contentEntry/getEntry/abstractions.js";
import { CreateEntryUseCase } from "~/features/contentEntry/createEntry/abstractions.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/updateEntry/abstractions.js";
import { PublishEntryUseCase } from "~/features/contentEntry/publishEntry/abstractions.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/unpublishEntry/abstractions.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/deleteEntry/abstractions.js";
import { UpdateRevisionDescriptionUseCase } from "~/features/contentEntry/updateRevisionDescription/abstractions.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import {
    ContentEntryFormModelModifier,
    ContentEntryFormPresenter as Abstraction
} from "./abstractions.js";
import { TRASH_ENTRY_DIALOG } from "~/presentation/contentEntries/list/ContentEntriesPresenter.js";
import { CreateRevisionFromUseCase } from "~/features/contentEntry/createRevisionFrom/abstractions.js";

interface PublishEntryDialogData {
    revisionDescription: string;
}

interface SaveEntryParams {
    entry: CmsContentEntry;
    data: Record<string, unknown>;
    skipValidation?: boolean;
}

export const PUBLISH_ENTRY_DIALOG = "publish-entry";

class ContentEntryFormPresenterImpl implements Abstraction.Interface {
    private entry: CmsContentEntry | null = null;
    private form: FormModel.Interface | null = null;
    private loading: string | null = null;
    private folderId: string | null = null;

    constructor(
        private readonly formModelFactory: FormModelFactory.Interface,
        private readonly cmsFormModelBuilder: CmsFormModelBuilder.Interface,
        private readonly confirmation: Confirmation.Interface,
        private readonly modelAccessor: CmsModelContext.Interface,
        private readonly getEntryUseCase: GetEntryUseCase.Interface,
        private readonly createEntryUseCase: CreateEntryUseCase.Interface,
        private readonly createRevisionFromUseCase: CreateRevisionFromUseCase.Interface,
        private readonly updateEntryUseCase: UpdateEntryUseCase.Interface,
        private readonly publishEntryUseCase: PublishEntryUseCase.Interface,
        private readonly unpublishEntryUseCase: UnpublishEntryUseCase.Interface,
        private readonly deleteEntryUseCase: DeleteEntryUseCase.Interface,
        private readonly updateRevisionDescriptionUseCase: UpdateRevisionDescriptionUseCase.Interface,
        private readonly formModelModifiers: ContentEntryFormModelModifier.Interface[]
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
            | "formModelModifiers"
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
            formModelModifiers: false,
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
        /**
         * Can save if the entry is locked and published/unpublished - it will trigger create new revision.
         * Or if the entry is not locked and the form is not null (meaning we are creating a new entry or editing an existing one).
         */
        const canSave =
            (isLocked && (status === "published" || status === "unpublished")) ||
            (!isLocked && this.form !== null);

        return {
            loading: this.loading,
            model: this.model,
            entry: toJS(this.entry),
            form: this.form?.vm ?? null,
            canSave,
            status,
            canCreateNewRevision:
                !!status && canSave && ["published", "unpublished"].includes(status),
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
                /**
                 * In case the entry already exists, and it is NOT locked, we will update the existing revision.
                 * If it is locked, we will create a new revision from the existing one, and then update that new revision.
                 */
                const entry = await this.saveEntry({
                    entry: this.entry,
                    data,
                    skipValidation
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

    newEntry(initialValues?: Record<string, unknown>): void {
        this.entry = null;
        this.form = this.buildForm();
        if (initialValues) {
            this.form.setData(initialValues, { dirty: true });
        }
    }

    reset(): void {
        this.form = null;
        this.entry = null;
    }

    private buildForm(): FormModel.Interface {
        const formConfig = this.cmsFormModelBuilder.build(this.model);
        const form = this.formModelFactory.create(formConfig);
        for (const modifier of this.formModelModifiers) {
            modifier.modifyForm(form, this.model);
        }
        return form;
    }

    private buildAndPopulateForm(entry: CmsContentEntry): void {
        this.form = this.buildForm();
        this.form.setData(entry.values);
        this.form.reset();
    }
    /**
     * Depending on whether the entry is locked or not, this method will either create a new revision from the existing one and update it, or simply update the existing revision.
     */
    private async saveEntry(params: SaveEntryParams): Promise<any> {
        const { entry, data, skipValidation } = params;

        if (entry.meta.locked) {
            return await this.createRevisionFromUseCase.execute({
                model: this.model,
                revisionId: entry.id,
                data: {
                    values: data
                },
                options: { skipValidation }
            });
        }
        return await this.updateEntryUseCase.execute({
            model: this.model,
            revisionId: entry.id,
            data: {
                values: data
            },
            options: { skipValidation }
        });
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
        CreateRevisionFromUseCase,
        UpdateEntryUseCase,
        PublishEntryUseCase,
        UnpublishEntryUseCase,
        DeleteEntryUseCase,
        UpdateRevisionDescriptionUseCase,
        [ContentEntryFormModelModifier, { multiple: true }]
    ]
});
