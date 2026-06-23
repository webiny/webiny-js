import {
    isLayoutField,
    type CmsEditorFieldsLayout,
    type CmsLayoutField,
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
                value: r.value != null ? String(r.value) : null,
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
                        value: r.value != null ? String(r.value) : null,
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
                value: r.value != null ? String(r.value) : null,
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
                value: r.value != null ? String(r.value) : null,
                action: r.action as "hide" | "disable"
            }))
        );
    }
    return builder;
}
