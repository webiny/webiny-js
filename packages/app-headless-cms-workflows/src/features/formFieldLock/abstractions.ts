import { createAbstraction } from "@webiny/feature/admin";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

/*
 * Disables the fields of the entry forms while a review locks the editor, so field renderers that
 * hide their controls for a disabled field (the reference field's "Create a new record" and
 * "Select an existing record") hide them too. A disabled fieldset does not reach them.
 */
export interface ICmsEntryFormFieldLock {
    readonly isLocked: boolean;
    track(form: IFormModel, model: Pick<CmsModel, "fields">): void;
    setLocked(isLocked: boolean): void;
}

export const CmsEntryFormFieldLock = createAbstraction<ICmsEntryFormFieldLock>(
    "Cms/Workflows/EntryFormFieldLock"
);

export namespace CmsEntryFormFieldLock {
    export type Interface = ICmsEntryFormFieldLock;
}
