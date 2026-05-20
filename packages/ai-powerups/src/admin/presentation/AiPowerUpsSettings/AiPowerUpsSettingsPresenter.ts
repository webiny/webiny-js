import { makeAutoObservable, computed, runInAction } from "mobx";
import { FormModelFactory, FormModel } from "@webiny/app-admin";
import type { ILayoutNodeBuilder } from "@webiny/app-admin/features/formModel/abstractions.js";
import { GetSettingsUseCase } from "../../features/settings/getSettings/abstractions.js";
import { UpdateSettingsUseCase } from "../../features/settings/updateSettings/abstractions.js";
import { AiPowerUpsSettingsPresenter as PresenterAbstraction } from "./abstractions.js";
import { AiPowerUpsSettingsGroup } from "./settingsGroup.js";
import { SettingsValidationError } from "~/admin/domain/errors.js";
import type { IAiPowerUpsSettings } from "~/admin/features/settings/shared/abstractions.js";

type FieldsFactory = (
    fields: FormModelFactory.FieldBuilderRegistry
) => Record<string, FormModelFactory.FieldBuilder>;

type LayoutFactory = (layout: FormModelFactory.LayoutBuilder) => ILayoutNodeBuilder[];

interface CollectedGroup {
    group: AiPowerUpsSettingsGroup.Interface;
    fieldsFn: FieldsFactory | null;
    layoutFn: LayoutFactory | null;
}

class AiPowerUpsSettingsPresenterImpl implements PresenterAbstraction.Interface {
    private loading = false;
    private saving = false;
    private form: FormModel.Interface<IAiPowerUpsSettings> | null = null;
    private errors: string[] = [];

    constructor(
        private factory: FormModelFactory.Interface,
        private groups: AiPowerUpsSettingsGroup.Interface[],
        private getSettings: GetSettingsUseCase.Interface,
        private updateSettings: UpdateSettingsUseCase.Interface
    ) {
        makeAutoObservable(this, { vm: computed }, { autoBind: true });
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            loading: this.loading,
            saving: this.saving,
            form: this.form ? this.form.vm : null,
            errors: this.errors
        };
    }

    async init(): Promise<void> {
        this.loading = true;
        this.errors = [];

        try {
            const data = await this.getSettings.execute();
            runInAction(() => {
                this.form = this.buildForm();
                this.form.setData(data);
            });
        } catch (err) {
            runInAction(() => {
                this.errors = [err instanceof Error ? err.message : "Failed to load settings."];
            });
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    async save(): Promise<boolean> {
        if (!this.form) {
            return false;
        }

        const data = await this.form.submit<IAiPowerUpsSettings>();
        if (!data) {
            return false;
        }

        runInAction(() => {
            this.saving = true;
            this.errors = [];
        });

        try {
            await this.updateSettings.execute(data);
            return true;
        } catch (err) {
            runInAction(() => {
                if (err instanceof SettingsValidationError) {
                    this.errors = Object.values(err.data.invalidFields).map(e => e.message);
                } else {
                    this.errors = [err instanceof Error ? err.message : "Failed to save settings."];
                }
            });
            return false;
        } finally {
            runInAction(() => {
                this.saving = false;
            });
        }
    }

    importData(data: Record<string, unknown>): void {
        if (!this.form) {
            return;
        }
        const current = this.form.getData();
        this.form.setData({ ...current, ...data } as IAiPowerUpsSettings);
    }

    private collectGroups(): CollectedGroup[] {
        return this.groups.map(group => {
            const collected: CollectedGroup = {
                group,
                fieldsFn: null,
                layoutFn: null
            };

            const builder: AiPowerUpsSettingsGroup.FormBuilder = {
                fields(fn: FieldsFactory) {
                    collected.fieldsFn = fn;
                },
                layout(fn: LayoutFactory) {
                    collected.layoutFn = fn;
                }
            };

            group.buildForm(builder);

            return collected;
        });
    }

    private buildForm() {
        const collected = this.collectGroups();

        const form = this.factory.create<IAiPowerUpsSettings>({
            fields: fields => {
                const result: Record<string, FormModelFactory.FieldBuilder> = {};
                for (const { group, fieldsFn } of collected) {
                    if (!fieldsFn) {
                        continue;
                    }
                    result[group.name] = fields
                        .object()
                        .label(group.label)
                        .renderer("passthrough")
                        .fields(fieldsFn);
                }
                return result;
            },
            layout: layout => {
                if (collected.length === 0) {
                    return [];
                }

                const tabsBuilder = layout.tabs("settings-tabs").renderer("tabsVertical");

                for (const { group } of collected) {
                    tabsBuilder.tab(group.name, tab => {
                        tab.label(group.label);
                        if (group.description) {
                            tab.description(group.description);
                        }
                        if (group.icon) {
                            tab.icon(group.icon);
                        }
                        tab.layout(l => [l.row(group.name)]);
                    });
                }

                return [tabsBuilder];
            }
        });

        return form;
    }
}

export const AiPowerUpsSettingsPresenter = PresenterAbstraction.createImplementation({
    implementation: AiPowerUpsSettingsPresenterImpl,
    dependencies: [
        FormModelFactory,
        [AiPowerUpsSettingsGroup, { multiple: true }],
        GetSettingsUseCase,
        UpdateSettingsUseCase
    ]
});
