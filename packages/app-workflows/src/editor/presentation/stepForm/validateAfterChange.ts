import type { AfterChangeCallback } from "@webiny/app-admin";

/*
 * FormModel validates on blur only after a submit, so a field with a client rule validates after
 * each edit instead: its message appears once it was edited (QBZ-13) and the next edit replaces a
 * server error set with `setValidation`.
 */
export const validateAfterChange = (path: string): AfterChangeCallback => {
    return (_value, params) => {
        void params.form.field(path).validate();
    };
};
