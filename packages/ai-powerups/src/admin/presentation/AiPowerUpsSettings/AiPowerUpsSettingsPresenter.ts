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
             * Neither of these runs before the other. Both calls are made in this same tick, left
             * to right, and `Promise.all` only waits; the array positions pick which result lands
             * in `data` and which in `initResults`, nothing more.
             *
             * The ordering that does matter is against `buildForm()` below. A group's `init()`
             * loads what its `buildForm` then reads (`CapabilitiesSettings` renders a row per
             * capability from its repository), so every init has to have settled before the form is
             * built. The `await` here is what guarantees that, not the order of this array.
             *
             * `allSettled`, not `all`: one group's failed init should not take the whole screen
             * down. Under `all` a single rejection skipped straight to the catch below and left the
             * page with a heading, a Save button and no tabs at all, hiding every working section.
             *
             * How far that actually goes is worth knowing, because it is less than it looks. Firing
             * in the same tick is exactly what puts these queries in one `BatchingGraphQLClient`
             * batch, and it rejects *every* operation in a batch when any one of them errors (see
             * `executeBatchGroup`). A group whose query fails against the server therefore takes
             * `getSettings` with it and we still end up in the catch.
             *
             * What this does fix is the rest: a group that throws inside its own `init()`, one
             * whose query missed the batch window, and the reporting. Instead of one opaque
             * failure, each bad section is named. Making the parallel case survive too means not
             * batching `getSettings` alongside the group inits, which costs a serial round trip on
             * every load of this screen; worth doing only if this turns out to bite in practice.
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
