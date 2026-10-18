import type { FormModel } from "@webiny/app-admin";

/*
 * Finds a field VM by dotted path (`title`, `settings.url`) in a form VM's layout, as a renderer
 * would reach it; null when the field is not in the layout.
 */
export const findFormFieldVm = (
    form: FormModel.FormVM | null,
    path: string
): FormModel.FieldVM | null => {
    if (form === null) {
        return null;
    }
    const [head, ...rest] = path.split(".");
    const top: FormModel.FieldVM[] = [];
    for (const node of form.layout) {
        if (node.type === "row") {
            top.push(...node.fields);
        }
    }

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
