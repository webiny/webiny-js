import {
    isLayoutField,
    type CmsEditorFieldsLayout,
    type CmsLayoutField,
    type CmsModelField,
    type CmsSeparatorLayoutField,
    type CmsTabLayoutField,
    type CmsAlertLayoutField
} from "~/types.js";
import type {
    ILayoutBuilder,
    ILayoutNodeBuilder
} from "@webiny/app-admin/features/formModel/abstractions.js";

export function mapCmsLayout(
    cmsLayout: CmsEditorFieldsLayout,
    layoutBuilder: ILayoutBuilder,
    idToFieldId: Map<string, string>
): ILayoutNodeBuilder[] {
    const nodes: ILayoutNodeBuilder[] = [];

    for (const row of cmsLayout) {
        if (row.length === 0) {
            continue;
        }

        const firstCell = row[0];

        if (row.length === 1 && isLayoutField(firstCell)) {
            const layoutField = firstCell as CmsLayoutField;
            const node = mapLayoutField(layoutField, layoutBuilder, idToFieldId);
            if (node) {
                nodes.push(node);
            }
            continue;
        }

        const fieldIds: string[] = [];
        for (const cell of row) {
            if (typeof cell === "string") {
                const fieldId = idToFieldId.get(cell);
                if (fieldId) {
                    fieldIds.push(fieldId);
                }
            }
        }

        if (fieldIds.length > 0) {
            nodes.push(layoutBuilder.row(...fieldIds));
        }
    }

    return nodes;
}

export function collectFieldIds(
    layout: CmsEditorFieldsLayout,
    idToFieldId: Map<string, string>
): Set<string> {
    const fieldIds = new Set<string>();

    for (const row of layout) {
        for (const cell of row) {
            if (typeof cell === "string") {
                const fieldId = idToFieldId.get(cell);
                if (fieldId) {
                    fieldIds.add(fieldId);
                }
            } else if (isLayoutField(cell) && cell.type === "tabs") {
                const tabsField = cell as { tabs: Array<{ layout: CmsEditorFieldsLayout }> };
                for (const tab of tabsField.tabs) {
                    for (const id of collectFieldIds(tab.layout, idToFieldId)) {
                        fieldIds.add(id);
                    }
                }
            }
        }
    }

    return fieldIds;
}

/**
 * Maps the layout stored on an object field or a dynamic zone template. Returns `undefined`
 * when there is no layout, so the form falls back to one row per child. Children missing
 * from the layout get a row of their own at the end, so a stale layout can't hide them.
 */
export function mapCmsNestedLayout(
    cmsLayout: CmsEditorFieldsLayout | undefined,
    fields: CmsModelField[]
): ((layoutBuilder: ILayoutBuilder) => ILayoutNodeBuilder[]) | undefined {
    if (!cmsLayout || cmsLayout.length === 0) {
        return undefined;
    }

    const idToFieldId = new Map<string, string>();
    for (const field of fields) {
        idToFieldId.set(field.id, field.fieldId);
    }

    const fieldIdsInLayout = collectFieldIds(cmsLayout, idToFieldId);

    return layoutBuilder => {
        const nodes = mapCmsLayout(cmsLayout, layoutBuilder, idToFieldId);
        for (const field of fields) {
            if (!fieldIdsInLayout.has(field.fieldId)) {
                nodes.push(layoutBuilder.row(field.fieldId));
            }
        }
        return nodes;
    };
}

function mapLayoutField(
    field: CmsLayoutField,
    layoutBuilder: ILayoutBuilder,
    idToFieldId: Map<string, string>
): ILayoutNodeBuilder | null {
    switch (field.type) {
        case "separator":
            return mapSeparator(field as CmsSeparatorLayoutField, layoutBuilder);

        case "tabs":
            return mapTabs(field as CmsTabLayoutField, layoutBuilder, idToFieldId);

        case "alert":
            return mapAlert(field as CmsAlertLayoutField, layoutBuilder);

        default:
            return null;
    }
}

function mapSeparator(
    field: CmsSeparatorLayoutField,
    layoutBuilder: ILayoutBuilder
): ILayoutNodeBuilder {
    const builder = layoutBuilder.separator();
    if (field.label) {
        builder.title(field.label);
    }
    if (field.description) {
        builder.description(field.description);
    }
    if (field.rules) {
        builder.rules(
            field.rules.map(r => ({
                type: r.type,
                target: r.target,
                operator: r.operator,
                value: r.value ?? null,
                action: r.action as "hide" | "disable"
            }))
        );
    }
    return builder;
}

function mapTabs(
    field: CmsTabLayoutField,
    layoutBuilder: ILayoutBuilder,
    idToFieldId: Map<string, string>
): ILayoutNodeBuilder {
    const tabsBuilder = layoutBuilder.tabs(field.id);

    for (const tab of field.tabs) {
        tabsBuilder.tab(tab.id, t => {
            t.label(tab.label);
            if (tab.icon) {
                t.icon({ type: "icon", name: tab.icon });
            }
            t.layout(l => mapCmsLayout(tab.layout, l, idToFieldId));
            if (tab.rules) {
                t.rules(
                    tab.rules.map(r => ({
                        type: r.type,
                        target: r.target,
                        operator: r.operator,
                        value: r.value ?? null,
                        action: r.action as "hide" | "disable"
                    }))
                );
            }
        });
    }

    if (field.rules) {
        tabsBuilder.rules(
            field.rules.map(r => ({
                type: r.type,
                target: r.target,
                operator: r.operator,
                value: r.value ?? null,
                action: r.action as "hide" | "disable"
            }))
        );
    }

    return tabsBuilder;
}

function mapAlert(field: CmsAlertLayoutField, layoutBuilder: ILayoutBuilder): ILayoutNodeBuilder {
    const builder = layoutBuilder.alert();
    if (field.label) {
        builder.message(field.label);
    }
    if (field.alertType) {
        builder.alertType(field.alertType);
    }
    if (field.rules) {
        builder.rules(
            field.rules.map(r => ({
                type: r.type,
                target: r.target,
                operator: r.operator,
                value: r.value ?? null,
                action: r.action as "hide" | "disable"
            }))
        );
    }
    return builder;
}
