import { makeAutoObservable, computed } from "mobx";
import { FormModelFactory, FormModel } from "@webiny/app-admin";
import type { LayoutNode } from "@webiny/app-admin/features/formModel/abstractions.js";
import { PageSettingsPresenter as PresenterAbstraction } from "./abstractions.js";
import { PageSettingsGroup } from "./abstractions.js";
import { PageSettingsGroupModifier } from "./abstractions.js";

type FieldsFactory = (
    fields: FormModelFactory.FieldBuilderRegistry
) => Record<string, FormModelFactory.FieldBuilder>;

type LayoutFactory = (layout: FormModelFactory.LayoutBuilder) => LayoutNode[];

interface CollectedGroup {
    group: PageSettingsGroup.Interface;
    fieldsFn: FieldsFactory | null;
    layoutFn: LayoutFactory | null;
}

class PageSettingsPresenterImpl implements PresenterAbstraction.Interface {
    private form: FormModel.Interface | null = null;
    private error: string | null = null;
    private originalData: PageSettingsGroup.PageDocument | null = null;

    constructor(
        private factory: FormModelFactory.Interface,
        private groups: PageSettingsGroup.Interface[],
        private modifiers: PageSettingsGroupModifier.Interface[] | undefined
    ) {
        makeAutoObservable(this, { vm: computed }, { autoBind: true });
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            form: this.form ? this.form.vm : null,
            error: this.error
        };
    }

    init(data: PageSettingsGroup.PageDocument): void {
        this.error = null;
        this.originalData = data;

        this.form = this.buildForm();

        const mapped: Record<string, any> = {};
        for (const group of this.groups) {
            mapped[group.name] = group.mapToForm(data);
        }

        for (const modifier of this.modifiers ?? []) {
            if (modifier.mapToForm) {
                const modData = modifier.mapToForm(data);
                mapped[modifier.group] = { ...mapped[modifier.group], ...modData };
            }
        }

        this.form.setData(mapped);
    }

    async submit(): Promise<PageSettingsGroup.PageDocument | false> {
        if (!this.form || !this.originalData) {
            return false;
        }

        const data = await this.form.submit<Record<string, any>>();
        if (!data) {
            return false;
        }

        const doc = structuredClone(this.originalData);

        for (const group of this.groups) {
            group.mapFromForm(data[group.name] ?? {}, doc);
        }

        for (const modifier of this.modifiers ?? []) {
            if (modifier.mapFromForm) {
                modifier.mapFromForm(data[modifier.group] ?? {}, doc);
            }
        }

        return doc;
    }

    private collectGroups(): CollectedGroup[] {
        return this.groups.map(group => {
            const collected: CollectedGroup = {
                group,
                fieldsFn: null,
                layoutFn: null
            };

            const builder: PageSettingsGroup.FormBuilder = {
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

        const form = this.factory.create({
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

                return [
                    layout.tabs({
                        id: "settings-tabs",
                        renderer: "tabs-vertical",
                        tabs: collected.map(({ group }) => ({
                            id: group.name,
                            label: group.label,
                            description: group.description,
                            icon: group.icon,
                            layout: l => [l.row(group.name)]
                        }))
                    })
                ];
            }
        });

        for (const modifier of this.modifiers ?? []) {
            modifier.modifyForm(form);
        }

        return form;
    }
}

export const PageSettingsPresenterRegistration = PresenterAbstraction.createImplementation({
    implementation: PageSettingsPresenterImpl,
    dependencies: [
        FormModelFactory,
        [PageSettingsGroup, { multiple: true }],
        [PageSettingsGroupModifier, { multiple: true, optional: true }]
    ]
});
