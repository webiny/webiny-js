import type {
    IFieldVM,
    IFormVM,
    IObjectFieldVM,
    LayoutNodeVM
} from "@webiny/app-admin/features/formModel/abstractions.js";

/**
 * Collects the locators (qualifiedNames) of every field that lives *inside* an array/list field.
 *
 * A field nested in a list field shares one qualifiedName across all array items (the form model
 * doesn't embed the item index), so it can't uniquely anchor a comment thread to a single element.
 * Comment markers are therefore hidden for these fields until per-element anchoring is supported
 * (tracked as a follow-up). Entry-level, top-level, and single (non-list) nested fields are
 * unaffected.
 */
export const collectListFieldLocators = (form?: IFormVM | null): Set<string> => {
    const out = new Set<string>();
    if (form) {
        walkLayout(form.layout, out);
    }
    return out;
};

const walkLayout = (nodes: LayoutNodeVM[], out: Set<string>): void => {
    for (const node of nodes) {
        if (node.type === "row") {
            walkFields(node.fields, false, out);
        } else if (node.type === "tabs") {
            for (const tab of node.tabs) {
                walkLayout(tab.layout, out);
            }
        }
    }
};

const walkFields = (fields: IFieldVM[], insideList: boolean, out: Set<string>): void => {
    for (const field of fields) {
        if (insideList) {
            out.add(field.qualifiedName);
        }
        if (field.type !== "object") {
            continue;
        }
        const object = field as IObjectFieldVM;
        if (object.isList) {
            // Every item's children share the parent path (no index), so any item's fields yield
            // the same locators — walking all items just guarantees we see them even if item 0 is
            // structurally different (templated lists).
            for (const item of object.items ?? []) {
                walkFields(item.fields, true, out);
            }
        } else {
            walkFields(object.fields ?? [], insideList, out);
        }
    }
};
