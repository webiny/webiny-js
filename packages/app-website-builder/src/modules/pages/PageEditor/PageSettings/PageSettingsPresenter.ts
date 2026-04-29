import { makeAutoObservable, computed } from "mobx";
import { FormModelFactory, FormModel } from "@webiny/app-admin";
import type {
    LayoutNode,
    ILayoutNodeBuilder,
    IRowNode,
    LayoutPosition
} from "@webiny/app-admin/features/formModel/abstractions.js";
import { PageSettingsPresenter as PresenterAbstraction } from "./abstractions.js";
import { PageSettingsGroup } from "./abstractions.js";
import { PageSettingsGroupModifier } from "./abstractions.js";

type FieldsFactory = (
    fields: FormModelFactory.FieldBuilderRegistry
) => Record<string, FormModelFactory.FieldBuilder>;

type LayoutFactory = (layout: FormModelFactory.LayoutBuilder) => ILayoutNodeBuilder[];

interface CollectedGroup {
    group: PageSettingsGroup.Interface;
    fieldsFns: FieldsFactory[];
    layoutFns: LayoutFactory[];
}

function resolvePositionedNodes(nodes: LayoutNode[]): LayoutNode[] {
    const positioned: LayoutNode[] = [];
    const deferred: { node: LayoutNode; position: LayoutPosition }[] = [];

    for (const node of nodes) {
        if ("position" in node && (node as IRowNode).position) {
            deferred.push({ node, position: (node as IRowNode).position! });
        } else {
            positioned.push(node);
        }
    }

    for (const { node, position } of deferred) {
        const targetIndex = positioned.findIndex(
            n => n.type === "row" && (n as IRowNode).fieldIds.includes(position.target)
        );
        if (targetIndex === -1) {
            positioned.push(node);
            continue;
        }
        const insertAt = position.type === "after" ? targetIndex + 1 : targetIndex;
        positioned.splice(insertAt, 0, node);
    }

    return positioned;
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

        console.log("data", data);

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
            const fieldsFns: FieldsFactory[] = [];
            const layoutFns: LayoutFactory[] = [];

            const builder: PageSettingsGroup.FormBuilder = {
                fields(fn: FieldsFactory) {
                    fieldsFns.push(fn);
                },
                layout(fn: LayoutFactory) {
                    layoutFns.push(fn);
                }
            };

            group.buildForm(builder);

            for (const modifier of this.modifiers ?? []) {
                if (modifier.group === group.name) {
                    modifier.modifyForm(builder);
                }
            }

            return { group, fieldsFns, layoutFns };
        });
    }

    private buildForm() {
        const collected = this.collectGroups();

        return this.factory.create({
            fields: fields => {
                const result: Record<string, FormModelFactory.FieldBuilder> = {};
                for (const { group, fieldsFns } of collected) {
                    if (fieldsFns.length === 0) {
                        continue;
                    }
                    result[group.name] = fields
                        .object()
                        .label(group.label)
                        .renderer("passthrough")
                        .fields(registry => {
                            const merged: Record<string, FormModelFactory.FieldBuilder> = {};
                            for (const fn of fieldsFns) {
                                Object.assign(merged, fn(registry));
                            }
                            return merged;
                        });
                }
                return result;
            },
            layout: layout => {
                if (collected.length === 0) {
                    return [];
                }

                const tabsBuilder = layout.tabs("settings-tabs").renderer("tabs-vertical");

                for (const { group, layoutFns } of collected) {
                    tabsBuilder.tab({
                        id: group.name,
                        label: group.label,
                        description: group.description,
                        icon: group.icon,
                        layout: (l: FormModelFactory.LayoutBuilder) => {
                            if (layoutFns.length > 0) {
                                return [
                                    l.object(group.name, inner => {
                                        const builders: ILayoutNodeBuilder[] = [];
                                        for (const fn of layoutFns) {
                                            builders.push(...fn(inner));
                                        }
                                        const resolved = resolvePositionedNodes(
                                            builders.map(b => b.build())
                                        );
                                        return resolved.map(node => ({ build: () => node }));
                                    })
                                ];
                            }

                            return [l.row(group.name)];
                        }
                    });
                }

                return [tabsBuilder];
            }
        });
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
