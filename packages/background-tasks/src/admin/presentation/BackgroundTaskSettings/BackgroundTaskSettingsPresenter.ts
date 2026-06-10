import { computed, makeAutoObservable, runInAction } from "mobx";
import {
    BackgroundTaskSettingsPresenter as Abstraction,
    type IBackgroundTaskSettingsPresenter,
    type IBackgroundTaskSettingsViewModel
} from "./abstractions.js";
import { GetBackgroundTaskSettingsUseCase } from "~/admin/features/getBackgroundTaskSettings/abstractions.js";
import { UpdateBackgroundTaskSettingsUseCase } from "~/admin/features/updateBackgroundTaskSettings/abstractions.js";
import {
    FormModelFactory,
    type IFormModel
} from "@webiny/app-admin/features/formModel/abstractions.js";
import { BACKGROUND_TASK_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";

class BackgroundTaskSettingsPresenterImpl implements IBackgroundTaskSettingsPresenter {
    private _loading = false;
    private _saving = false;
    private _form: IFormModel;

    public get vm(): IBackgroundTaskSettingsViewModel {
        return {
            loading: this._loading,
            saving: this._saving,
            form: this._form.vm
        };
    }

    public constructor(
        private readonly formModelFactory: FormModelFactory.Interface,
        private readonly getSettingsUseCase: GetBackgroundTaskSettingsUseCase.Interface,
        private readonly updateSettingsUseCase: UpdateBackgroundTaskSettingsUseCase.Interface
    ) {
        this._form = this.buildForm();

        makeAutoObservable(this, { vm: computed });
    }

    private buildForm(): IFormModel {
        return this.formModelFactory.create({
            fields: fields => ({
                retentionDays: fields
                    .number()
                    .label("Retention (days)")
                    .placeholder("90")
                    .description(
                        `How long to keep completed task runs. 0 = never delete. Max ${BACKGROUND_TASK_MAX_RETENTION_DAYS} days. Changing this value only affects future task executions; existing records are not retroactively deleted.`
                    )
            }),
            layout: layout => [layout.row("retentionDays")]
        });
    }

    public async save(): Promise<boolean> {
        const data = await this._form.submit<Record<string, string>>();
        if (data === false) {
            return false;
        }

        runInAction(() => {
            this._saving = true;
        });

        try {
            const settings = await this.updateSettingsUseCase.execute({
                retentionDays: data.retentionDays != null ? Number(data.retentionDays) : undefined
            });

            runInAction(() => {
                this._form.setData({
                    retentionDays: settings.retentionDays ?? ""
                });
            });
        } finally {
            runInAction(() => {
                this._saving = false;
            });
        }
        return true;
    }

    public async init(): Promise<void> {
        this._loading = true;

        try {
            const settings = await this.getSettingsUseCase.execute();

            runInAction(() => {
                this._form = this.buildForm();
                this._form.setData({
                    retentionDays: settings.retentionDays ?? ""
                });
                this._loading = false;
            });
        } catch {
            runInAction(() => {
                this._loading = false;
            });
        }
    }
}

export const BackgroundTaskSettingsPresenter = Abstraction.createImplementation({
    implementation: BackgroundTaskSettingsPresenterImpl,
    dependencies: [
        FormModelFactory,
        GetBackgroundTaskSettingsUseCase,
        UpdateBackgroundTaskSettingsUseCase
    ]
});
