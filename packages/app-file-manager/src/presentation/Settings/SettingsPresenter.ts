import { makeAutoObservable, runInAction, computed } from "mobx";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { GetSettingsRepository } from "../../features/settings/abstractions.js";
import type { FmSettings } from "../../features/shared/types.js";

/**
 * The form holds only a custom file delivery URL. When the prefix in effect is the default, the
 * field is left empty (the default shows as its placeholder), so saving the form untouched keeps
 * following the API's public URL instead of pinning today's.
 */
const toFormData = (settings: FmSettings) => {
    const isCustomSrcPrefix = settings.srcPrefix !== settings.defaultSrcPrefix;
    return {
        uploadMinFileSize: settings.uploadMinFileSize,
        uploadMaxFileSize: settings.uploadMaxFileSize,
        srcPrefix: isCustomSrcPrefix ? settings.srcPrefix : ""
    };
};

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
                this.form = this.buildForm(settings.defaultSrcPrefix);
                this.form.setData(toFormData(settings));
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
            const settings = await this.settingsRepository.save({
                uploadMinFileSize: data.uploadMinFileSize as string,
                uploadMaxFileSize: data.uploadMaxFileSize as string,
                srcPrefix: (data.srcPrefix as string | undefined) ?? ""
            });
            runInAction(() => {
                this.form.setData(toFormData(settings));
            });
            return true;
        } finally {
            runInAction(() => {
                this.saving = false;
            });
        }
    }

    private buildForm(defaultSrcPrefix = ""): IFormModel {
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
                    .placeholder(defaultSrcPrefix)
                    .description(
                        "Leave empty to serve files from the API's own URL. Set it only when files are served from another domain, such as a CDN."
                    )
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
