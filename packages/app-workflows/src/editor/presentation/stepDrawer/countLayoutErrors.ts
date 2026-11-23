import type { IFieldVM } from "@webiny/app-admin";
import type { LayoutNodeVM } from "@webiny/app-admin";

// What an object field adds to a field: its children, or its list items' children.
interface ObjectFieldItemLike {
    fields: IFieldVM[];
}

interface ObjectFieldLike extends IFieldVM {
    fields?: IFieldVM[];
    items?: ObjectFieldItemLike[];
}

// The routing rules field: its errors are counted per rule message (`countRuleErrors`), not as one field.
export const RULES_FIELD_NAME = "assignment.rules";

const countFieldErrors = (field: ObjectFieldLike): number => {
    if (field.qualifiedName === RULES_FIELD_NAME) {
        return 0;
    }
    let count = 0;
    if (field.validation.isValid === false) {
        count += 1;
    }
    if (field.type !== "object") {
        return count;
    }
    for (const child of field.fields ?? []) {
        count += countFieldErrors(child);
    }
    for (const item of field.items ?? []) {
        for (const child of item.fields) {
            count += countFieldErrors(child);
        }
    }
    return count;
};

/*
 * The invalid fields of a layout (the routing rules field aside), nested object fields and tabs included (B23): the error count of
 * a step drawer tab. The same fields the form model's own `hasErrors` of a tab looks at.
 */
export const countLayoutErrors = (layout: LayoutNodeVM[]): number => {
    let count = 0;
    for (const node of layout) {
        if (node.type === "row") {
            for (const field of node.fields) {
                count += countFieldErrors(field);
            }
        } else if (node.type === "tabs") {
            for (const tab of node.tabs) {
                count += countLayoutErrors(tab.layout);
            }
        }
    }
    return count;
};
