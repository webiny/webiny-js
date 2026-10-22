import type {
    IFieldVM,
    IFormVM,
    IObjectFieldVM,
    LayoutNodeVM
} from "@webiny/app-admin/features/formModel/abstractions.js";

/**
 * Per-item comment anchoring for fields nested inside repeatable/list object fields (and multiple
 * dynamic zones).
 *
 * A field nested in a list shares one `qualifiedName` across every array item (the form model
 * doesn't embed the item index), so a bare `qualifiedName` can't anchor a thread to a single
 * element. Each object / dynamic-zone item now carries a stable, hidden `_id` (injected by the CMS
 * form-model mappers), which we interleave after each list segment to produce a per-item locator:
 *
 *   list `author.phone`, item `_id === "abc123"`, leaf `type`  ->  `author.phone.abc123.type`
 *
 * Nested lists interleave an id after every list ancestor.
 *
 * The `_id` is a hidden field, so it is filtered out of the item's VM `fields` array (the VM only
 * exposes visible children). We therefore read the id from `form.getData()` — which serializes all
 * children, hidden included — navigating it in parallel with the layout walk.
 */
const ID_FIELD = "_id";

export interface ItemLocator {
    /** Id-interleaved locator, unique to this field within a single array item. */
    locator: string;
    /** "Parent › Field" breadcrumb (id segments excluded). */
    label: string;
}

export interface ItemLocatorMaps {
    /**
     * Per-field id-based locator, keyed by the exact `IFieldVM` instance rendered for that field.
     * The key is the field's mobx `computed` VM, stable while observed, so the marker decorator can
     * look up the leaf it renders and match the same instance we walked here.
     */
    byField: Map<IFieldVM, ItemLocator>;
    /** locator string -> breadcrumb label, for resolving labels of id-based locators. */
    byLocator: Map<string, string>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readItemId = (itemData: unknown, index: number): string => {
    if (isRecord(itemData)) {
        const id = itemData[ID_FIELD];
        if (typeof id === "string" && id.length > 0) {
            return id;
        }
    }
    // Legacy / not-yet-persisted item without an `_id` — fall back to the index so the locator is
    // still stable within a single render.
    return String(index);
};

export const collectItemLocators = (form?: IFormVM | null): ItemLocatorMaps => {
    const byField = new Map<IFieldVM, ItemLocator>();
    const byLocator = new Map<string, string>();

    if (!form) {
        return { byField, byLocator };
    }

    let rootData: Record<string, unknown> = {};
    try {
        rootData = (form.getData() as Record<string, unknown>) ?? {};
    } catch {
        rootData = {};
    }

    walkLayout(form.layout, rootData, [], [], false, byField, byLocator);
    return { byField, byLocator };
};

const walkLayout = (
    nodes: LayoutNodeVM[],
    dataNode: unknown,
    segments: string[],
    labels: string[],
    insideList: boolean,
    byField: Map<IFieldVM, ItemLocator>,
    byLocator: Map<string, string>
): void => {
    for (const node of nodes) {
        if (node.type === "row") {
            walkFields(node.fields, dataNode, segments, labels, insideList, byField, byLocator);
        } else if (node.type === "tabs") {
            for (const tab of node.tabs) {
                walkLayout(tab.layout, dataNode, segments, labels, insideList, byField, byLocator);
            }
        }
    }
};

const walkFields = (
    fields: IFieldVM[],
    dataNode: unknown,
    segments: string[],
    labels: string[],
    insideList: boolean,
    byField: Map<IFieldVM, ItemLocator>,
    byLocator: Map<string, string>
): void => {
    const record = isRecord(dataNode) ? dataNode : undefined;

    for (const field of fields) {
        // Defensive: the hidden `_id` never renders and is filtered from the VM, but skip it if it
        // ever surfaces so it can't become a locator/label segment.
        if (field.name === ID_FIELD) {
            continue;
        }

        const fieldSegments = [...segments, field.name];
        const fieldLabels = [...labels, field.label || field.name];

        // Every field living inside a list item gets an id-based locator. The list container field
        // itself is visited with `insideList === false`, so it keeps its plain `qualifiedName`.
        if (insideList) {
            const locator = fieldSegments.join(".");
            const label = fieldLabels.join(" › ");
            byField.set(field, { locator, label });
            byLocator.set(locator, label);
        }

        if (field.type !== "object") {
            continue;
        }

        const object = field as IObjectFieldVM;
        const childData = record ? record[field.name] : undefined;

        if (object.isList) {
            const items = object.items ?? [];
            const array = Array.isArray(childData) ? childData : [];
            items.forEach((item, index) => {
                const itemData = array[index];
                const itemId = readItemId(itemData, index);
                const itemSegments = [...fieldSegments, itemId];
                walkFields(
                    item.fields,
                    itemData,
                    itemSegments,
                    fieldLabels,
                    true,
                    byField,
                    byLocator
                );
            });
        } else {
            walkFields(
                object.fields ?? [],
                childData,
                fieldSegments,
                fieldLabels,
                insideList,
                byField,
                byLocator
            );
        }
    }
};
