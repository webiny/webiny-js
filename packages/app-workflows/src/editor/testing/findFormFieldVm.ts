import type { FormModel } from "@webiny/app-admin";

type LayoutNodeVm = FormModel.FormVM["layout"][number];

// The fields of the layout nodes: the rows, also inside the tabs (a tab holds its own layout).
const collectFields = (nodes: LayoutNodeVm[]): FormModel.FieldVM[] => {
    const fields: FormModel.FieldVM[] = [];
    for (const node of nodes) {
        if (node.type === "row") {
            fields.push(...node.fields);
        }
        if (node.type === "tabs") {
            for (const tab of node.tabs) {
                const tabFields = collectFields(tab.layout);
                fields.push(...tabFields);
            }
        }
    }
    return fields;
};

/*
 * Finds a field VM by dotted path (`title`, `settings.url`, `assignment.rules`) in a form VM's
 * layout, through tabs and object fields, as a renderer would reach it; null when the field is not
 * in the layout.
 */
export const findFormFieldVm = (
    form: FormModel.FormVM | null,
    path: string
): FormModel.FieldVM | null => {
    if (form === null) {
        return null;
    }
    const [head, ...rest] = path.split(".");
    const top = collectFields(form.layout);

    let found = top.find(field => field.name === head);
    for (const part of rest) {
        if (!found || found.type !== "object") {
            return null;
        }
        const objectField: FormModel.ObjectFieldVM = found as FormModel.ObjectFieldVM;
        found = objectField.fields.find(field => field.name === part);
    }

    return found ?? null;
};
