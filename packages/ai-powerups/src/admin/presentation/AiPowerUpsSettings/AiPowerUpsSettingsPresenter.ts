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
            /*
             * Two loads of different things, started together because neither feeds the other.
             *
             * `getSettings` fetches the saved *values*: the chosen connection, the model on each
             * role, the per-capability overrides. Those go into the form at `setData` below.
             *
             * A group's `init()` loads the catalogue its fields are built *from*.
             * `CapabilitiesSettings` needs the list of registered capabilities to render a row
             * each, plus the model list for the dropdowns; `ModelRoles` and `Connections` need the
             * model list. Four of the seven groups have no init at all, hence the optional call.
             *
             * So the settings blob does not say which fields exist and the catalogue does not say
             * what is configured. Running them one after the other would just cost a round trip.
             *
             * Neither is "first": both calls are made in this tick and `Promise.all` only waits, so
             * the array positions pick which result is `data` and which is `initResults`, nothing
             * more. The ordering that matters is that both finish before `buildForm()`, which reads
             * the catalogue, and `setData()`, which needs the values. The `await` does that.
             *
             * `allSettled`, not `all`: one group's failed init should not take the whole screen
             * down. Under `all` a single rejection skipped straight to the catch below and left the
             * page with a heading, a Save button and no tabs at all, hiding every working section.
             *
             * It rescues less than it looks, though. Firing in one tick is also what puts these
             * queries in a single `BatchingGraphQLClient` batch, and that rejects *every* operation
             * in a batch when any one errors (see `executeBatchGroup`), so a group whose query
             * fails server-side takes `getSettings` down with it and we reach the catch anyway.
             * What is left is real but narrower: a group that throws inside its own `init()`, one
             * whose query missed the batch window, and the reporting, which now names the failing
             * section. Covering the batched case means not batching `getSettings` with the group
             * inits, at the cost of a serial round trip on every load of this screen.
             */
            const [data, initResults] = await Promise.all([
                this.getSettings.execute(),
                Promise.allSettled(this.groups.map(group => group.init?.()))
            ]);

            /*
             * `flatMap` to filter and map in one pass: a fulfilled group contributes no message.
             * The index is load-bearing, and safe because `allSettled` resolves in input order, so
             * `initResults[index]` is the result for `this.groups[index]`.
             */
            const initErrors = initResults.flatMap((result, index) => {
                if (result.status !== "rejected") {
                    return [];
                }

                const label = this.groups[index].label;
                const reason =
                    result.reason instanceof Error ? result.reason.message : String(result.reason);

                return [`Could not load the "${label}" section: ${reason}`];
            });

            runInAction(() => {
                this.errors = initErrors;
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
