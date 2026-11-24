import { ContentEntryFormModelModifier } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { CmsEntryFormFieldLock } from "./abstractions.js";

// Hands every entry form the editor builds to the field lock.
class CmsEntryFormFieldLockModifierImpl implements ContentEntryFormModelModifier.Interface {
    constructor(private fieldLock: CmsEntryFormFieldLock.Interface) {}

    modifyForm(form: IFormModel, model: CmsModel): void {
        this.fieldLock.track(form, model);
    }
}

export const CmsEntryFormFieldLockModifier = ContentEntryFormModelModifier.createImplementation({
    implementation: CmsEntryFormFieldLockModifierImpl,
    dependencies: [CmsEntryFormFieldLock]
});
