import { makeAutoObservable, runInAction, computed } from "mobx";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { GetSettingsRepository } from "../../features/settings/abstractions.js";

export interface ISettingsViewModel {
    loading: boolean;
    saving: boolean;
    form: IFormVM;
}

export interface ISettingsPresenter {
    vm: ISettingsViewModel;
    load(): Promise<void>;
    save(): Promise<boolean>;
}

class SettingsPresenterImpl implements ISettingsPresenter {
    private loading = false;
    private saving = false;
    private form: IFormModel;

    constructor(
        private settingsRepository: GetSettingsRepository.Interface,
        private formModelFactory: FormModelFactory.Interface
    ) {
        this.form = this.buildForm();
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): ISettingsViewModel {
        return {
            loading: this.loading,
            saving: this.saving,
            form: this.form.vm
        };
    }

    async load(): Promise<void> {
        runInAction(() => {
            this.loading = true;
        });

        try {
            const settings = await this.settingsRepository.execute();
            runInAction(() => {
                this.form.setData({
                    uploadMinFileSize: settings.uploadMinFileSize,
                    uploadMaxFileSize: settings.uploadMaxFileSize,
                    srcPrefix: settings.srcPrefix
                });
            });
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    async save(): Promise<boolean> {
        const data = await this.form.submit();
        if (!data) {
            return false;
        }

        runInAction(() => {
            this.saving = true;
        });

        try {
            await this.settingsRepository.save({
                uploadMinFileSize: data.uploadMinFileSize as string,
                uploadMaxFileSize: data.uploadMaxFileSize as string,
                srcPrefix: data.srcPrefix as string
            });
            return true;
        } finally {
            runInAction(() => {
                this.saving = false;
            });
        }
    }

    private buildForm(): IFormModel {
        return this.formModelFactory.create({
            fields: fields => ({
                uploadMinFileSize: fields
                    .text()
                    .label("Minimum file upload size")
                    .placeholder("e.g. 0"),
                uploadMaxFileSize: fields
                    .text()
                    .label("Maximum file upload size")
                    .placeholder("e.g. 26214400"),
                srcPrefix: fields
                    .text()
                    .label("File delivery URL")
                    .required("File delivery URL is required.")
            }),
            layout: layout => [
                layout.row("uploadMinFileSize"),
                layout.row("uploadMaxFileSize"),
                layout.row("srcPrefix")
            ]
        });
    }
}

// Export a factory function for creating the presenter.
export function createSettingsPresenter(
    settingsRepository: GetSettingsRepository.Interface,
    formModelFactory: FormModelFactory.Interface
): ISettingsPresenter {
    return new SettingsPresenterImpl(settingsRepository, formModelFactory);
}
