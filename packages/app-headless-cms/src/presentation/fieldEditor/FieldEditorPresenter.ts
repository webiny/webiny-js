import { makeAutoObservable, computed } from "mobx";
import { FormModelFactory, FormModel } from "@webiny/app-admin";
import cloneDeep from "lodash/cloneDeep.js";
import {
    FieldEditorPresenter as PresenterAbstraction,
    CmsFieldEditorGroup,
    CmsFieldEditorGroupModifier
} from "./abstractions.js";
import type {
    ICmsFieldEditorFormBuilder,
    ICmsFieldEditorContext,
    ICmsFieldEditorGroup,
    ICmsFieldEditorGroupModifier,
    IFieldEditorPresenter
} from "./abstractions.js";
import { CmsFieldType } from "~/presentation/fieldTypes/abstractions.js";
import type { ICmsFieldType } from "~/presentation/fieldTypes/abstractions.js";
import type { CmsModel, CmsModelField } from "~/types.js";

type FieldsFactory = (
    fields: FormModelFactory.FieldBuilderRegistry
) => Record<string, FormModelFactory.FieldBuilder>;

type LayoutFactory = (layout: FormModelFactory.LayoutBuilder) => FormModel.LayoutNodeBuilder[];

interface CollectedGroup {
    group: ICmsFieldEditorGroup;
    fieldsFns: FieldsFactory[];
    layoutFns: LayoutFactory[];
}

class FieldEditorPresenterImpl implements IFieldEditorPresenter {
    private form: FormModel.Interface | null = null;
    private context: ICmsFieldEditorContext | null = null;
    private originalField: CmsModelField | null = null;

    constructor(
        private factory: FormModelFactory.Interface,
        private groups: ICmsFieldEditorGroup[],
        private modifiers: ICmsFieldEditorGroupModifier[] | undefined,
        private fieldTypes: ICmsFieldType[]
    ) {
        makeAutoObservable(this, { vm: computed }, { autoBind: true });
    }

    get vm() {
        return {
            form: this.form ? this.form.vm : null
        };
    }

    init(field: CmsModelField, model: CmsModel) {
        this.originalField = cloneDeep(field);

        const fieldType = this.fieldTypes.find(ft => ft.type === field.type);
        if (!fieldType) {
            throw new Error(`Unknown field type: ${field.type}`);
        }

        this.context = { field, model, fieldType };
        this.form = this.buildForm(this.context);

        const data: Record<string, any> = {};
        for (const group of this.groups) {
            data[group.name] = group.mapToForm(field, this.context);
        }

        for (const mod of this.getApplicableModifiers(this.context)) {
            if (mod.mapToForm) {
                const modData = mod.mapToForm(field, this.context);
                data[mod.group] = { ...data[mod.group], ...modData };
            }
        }

        this.form.setData(data);
    }

    async submit(): Promise<CmsModelField | false> {
        if (!this.form || !this.context || !this.originalField) {
            return false;
        }

        const data = await this.form.submit<Record<string, any>>();
        if (!data) {
            return false;
        }

        const field = cloneDeep(this.originalField);

        for (const group of this.groups) {
            group.mapFromForm(data[group.name] ?? {}, field, this.context);
        }

        for (const mod of this.getApplicableModifiers(this.context)) {
            if (mod.mapFromForm) {
                mod.mapFromForm(data[mod.group] ?? {}, field, this.context);
            }
        }

        return field;
    }

    private buildForm(context: ICmsFieldEditorContext) {
        const collected = this.collectGroups(context);

        return this.factory.create({
            fields: registry => {
                const result: Record<string, FormModelFactory.FieldBuilder> = {};
                for (const { group, fieldsFns } of collected) {
                    result[group.name] = registry
                        .object()
                        .label(group.label)
                        .renderer("passthrough")
                        .fields(childRegistry => {
                            const merged: Record<string, FormModelFactory.FieldBuilder> = {};
                            for (const fn of fieldsFns) {
                                Object.assign(merged, fn(childRegistry));
                            }
                            return merged;
                        });
                }
                return result;
            },
            layout: layout => {
                const tabs = layout
                    .tabs("field-settings")
                    .renderer("tabsHorizontal", { spacing: "lg", size: "md", separator: true });
                for (const { group, layoutFns } of collected) {
                    tabs.tab(group.name, tab => {
                        tab.label(group.label);

                        if (group.name === "predefinedValues") {
                            tab.rules([
                                {
                                    type: "condition",
                                    target: "general.predefinedValuesEnabled",
                                    operator: "isFalsy",
                                    value: null,
                                    action: "disable"
                                }
                            ]);
                        }

                        tab.layout(l => [
                            l.object(group.name, inner => layoutFns.flatMap(fn => fn(inner)))
                        ]);
                    });
                }
                return [tabs];
            }
        });
    }

    private collectGroups(context: ICmsFieldEditorContext): CollectedGroup[] {
        return this.groups.map(group => {
            const fieldsFns: FieldsFactory[] = [];
            const layoutFns: LayoutFactory[] = [];

            const builder: ICmsFieldEditorFormBuilder = {
                fields(fn: FieldsFactory) {
                    fieldsFns.push(fn);
                },
                layout(fn: LayoutFactory) {
                    layoutFns.push(fn);
                }
            };

            group.buildForm(builder, context);

            for (const mod of this.getApplicableModifiers(context)) {
                if (mod.group !== group.name) {
                    continue;
                }
                mod.modifyForm(builder, context);
            }

            return { group, fieldsFns, layoutFns };
        });
    }

    private getApplicableModifiers(
        context: ICmsFieldEditorContext
    ): ICmsFieldEditorGroupModifier[] {
        if (!this.modifiers) {
            return [];
        }
        return this.modifiers.filter(mod => {
            if (mod.shouldApply) {
                return mod.shouldApply(context);
            }
            return true;
        });
    }
}

export const FieldEditorPresenterRegistration = PresenterAbstraction.createImplementation({
    implementation: FieldEditorPresenterImpl,
    dependencies: [
        FormModelFactory,
        [CmsFieldEditorGroup, { multiple: true }],
        [CmsFieldEditorGroupModifier, { multiple: true, optional: true }],
        [CmsFieldType, { multiple: true }]
    ]
});
