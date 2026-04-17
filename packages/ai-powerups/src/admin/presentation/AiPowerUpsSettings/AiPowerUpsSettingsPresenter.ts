import { makeAutoObservable, computed, runInAction } from "mobx";
import { FormModelFactory, FormModel } from "@webiny/app-admin";
import { GetSettingsUseCase } from "../../features/settings/getSettings/abstractions.js";
import { UpdateSettingsUseCase } from "../../features/settings/updateSettings/abstractions.js";
import { AiPowerUpsSettingsPresenter as PresenterAbstraction } from "./abstractions.js";
import { AiPowerUpsSettingsGroup } from "./settingsGroup.js";

type FieldsFactory = (
    fields: FormModelFactory.FieldBuilderRegistry
) => Record<string, FormModelFactory.FieldBuilder>;

type LayoutFactory = (layout: FormModelFactory.LayoutBuilder) => FormModel.RowNode[];

interface CollectedGroup {
    group: AiPowerUpsSettingsGroup.Interface;
    fieldsFn: FieldsFactory | null;
    layoutFn: LayoutFactory | null;
}

class AiPowerUpsSettingsPresenterImpl implements PresenterAbstraction.Interface {
    private loading = false;
    private saving = false;
    private form: FormModel.Interface | null = null;
    private error: string | null = null;

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
            error: this.error
        };
    }

    async init(): Promise<void> {
        this.loading = true;
        this.error = null;

        try {
            const data = await this.getSettings.execute();
            runInAction(() => {
                this.form = this.buildForm();
                this.form.setData(data);
            });
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to load settings.";
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

        const data = await this.form.submit();
        if (!data) {
            return false;
        }

        this.saving = true;
        this.error = null;

        try {
            await this.updateSettings.execute(data as Record<string, any>);
            return true;
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to save settings.";
            });
            return false;
        } finally {
            runInAction(() => {
                this.saving = false;
            });
        }
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

    private buildForm(): FormModel.Interface {
        const collected = this.collectGroups();

        return this.factory.create({
            fields: fields => {
                const result: Record<string, FormModelFactory.FieldBuilder> = {};
                for (const { group, fieldsFn } of collected) {
                    if (!fieldsFn) {
                        continue;
                    }
                    // TODO: wrap each group's fields in fields.object(group.name).fields(...)
                    // once Phase 4 (Object & List fields) is implemented.
                    const groupFields = fieldsFn(fields);
                    for (const [key, fieldBuilder] of Object.entries(groupFields)) {
                        result[`${group.name}.${key}`] = fieldBuilder;
                    }
                }
                return result;
            },
            layout: layout => {
                if (collected.length === 0) {
                    return [];
                }

                return [
                    layout.tabs({
                        id: "settings-tabs",
                        tabs: collected.map(({ group, layoutFn }) => ({
                            id: group.name,
                            label: group.label,
                            description: group.description,
                            icon: group.icon,
                            layout: layoutFn
                                ? layoutFn(layout).map(node => {
                                      if (node.type === "row" && node.fieldIds) {
                                          return layout.row(
                                              ...node.fieldIds.map(
                                                  (id: string) => `${group.name}.${id}`
                                              )
                                          );
                                      }
                                      return node;
                                  })
                                : []
                        }))
                    })
                ];
            }
        });
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
