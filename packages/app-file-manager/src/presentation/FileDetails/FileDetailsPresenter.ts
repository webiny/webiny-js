import { makeAutoObservable, runInAction, computed } from "mobx";
import {
    FileDetailsPresenter as Abstraction,
    type IFileDetailsPresenter,
    type IFileDetailsViewModel
} from "./abstractions.js";
import { GetFileUseCase } from "../../features/getFile/abstractions.js";
import { UpdateFileUseCase } from "../../features/updateFile/abstractions.js";
import { DeleteFileUseCase } from "../../features/deleteFile/abstractions.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import { FileManagerPermissions } from "../../features/permissions/abstractions.js";
import { GetSettingsRepository } from "../../features/settings/abstractions.js";
import type { FmFile } from "../../features/shared/types.js";

class FileDetailsPresenterImpl implements IFileDetailsPresenter {
    private file: FmFile | null = null;
    private loading: string | null = null;
    private form: IFormModel;

    constructor(
        private getFileUseCase: GetFileUseCase.Interface,
        private updateFileUseCase: UpdateFileUseCase.Interface,
        private deleteFileUseCase: DeleteFileUseCase.Interface,
        private formModelFactory: FormModelFactory.Interface,
        private permissions: FileManagerPermissions.Interface,
        private settingsRepository: GetSettingsRepository.Interface
    ) {
        // Build an empty form initially.
        this.form = this.buildForm();

        makeAutoObservable(this, { vm: computed });
    }

    get vm(): IFileDetailsViewModel {
        return {
            file: this.file,
            loading: this.loading,
            form: this.form.vm,
            previewUrl: this.buildPreviewUrl(),
            permissions: {
                canEdit: this.permissions.canEdit("file", this.file ?? undefined),
                canDelete: this.permissions.canDelete("file", this.file ?? undefined)
            }
        };
    }

    async loadFile(id: string): Promise<void> {
        runInAction(() => {
            this.loading = "Loading file...";
        });

        try {
            const result = await this.getFileUseCase.execute({ id });
            runInAction(() => {
                if (result.success) {
                    this.file = result.file;
                    this.form = this.buildForm();
                    this.form.setData({
                        name: result.file.name ?? "",
                        description: result.file.description ?? "",
                        tags: result.file.tags ?? [],
                        accessControl: result.file.accessControl?.type ?? "public"
                    });

                    if (!this.permissions.canEdit("file", result.file)) {
                        this.form.field("name").setDisabled(true);
                        this.form.field("description").setDisabled(true);
                        this.form.field("tags").setDisabled(true);
                        this.form.field("accessControl").setDisabled(true);
                    }
                }
            });
        } finally {
            runInAction(() => {
                this.loading = null;
            });
        }
    }

    async saveFile(): Promise<boolean> {
        if (!this.file) {
            return false;
        }

        const data = await this.form.submit();
        if (!data) {
            return false;
        }

        runInAction(() => {
            this.loading = "Saving changes...";
        });

        try {
            await this.updateFileUseCase.execute({
                id: this.file.id,
                data: {
                    name: data.name as string,
                    description: data.description as string,
                    tags: data.tags as string[],
                    accessControl: {
                        type: data.accessControl as "public" | "private-authenticated"
                    }
                }
            });
            return true;
        } finally {
            runInAction(() => {
                this.loading = null;
            });
        }
    }

    private buildForm(): IFormModel {
        return this.formModelFactory.create({
            fields: fields => ({
                name: fields.text().label("Name").required().placeholder("Enter name"),
                description: fields
                    .text()
                    .label("Description")
                    .renderer("textarea")
                    .placeholder("Enter description"),
                tags: fields.text().label("Tags").list().renderer("tags").placeholder("Add tags"),
                accessControl: fields
                    .text()
                    .label("Access Control")
                    .help("Control who can access this file.")
                    .options([
                        { label: "Public", value: "public" },
                        { label: "Private (Authenticated)", value: "private-authenticated" }
                    ])
                    .defaultValue("public")
            }),
            layout: layout => [
                layout.row("name"),
                layout.row("description"),
                layout.row("tags"),
                layout.row("accessControl")
            ]
        });
    }

    private buildPreviewUrl(): string | null {
        if (!this.file?.key) {
            return null;
        }
        const srcPrefix = this.settingsRepository.settings?.srcPrefix ?? "";
        return `${srcPrefix}${this.file.key}`;
    }
}

export const FileDetailsPresenter = Abstraction.createImplementation({
    implementation: FileDetailsPresenterImpl,
    dependencies: [
        GetFileUseCase,
        UpdateFileUseCase,
        DeleteFileUseCase,
        FormModelFactory,
        FileManagerPermissions,
        GetSettingsRepository
    ]
});
