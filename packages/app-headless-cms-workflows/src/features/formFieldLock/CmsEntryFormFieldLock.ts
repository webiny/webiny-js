import { runInAction } from "mobx";
import type { IField } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { CmsEntryFormFieldLock as Abstraction } from "./abstractions.js";

/*
 * Every entry form built is tracked weakly (a form that is dropped is never kept alive). Locking
 * disables each enabled top-level field (a disabled object field disables its children); unlocking
 * enables only the fields the lock disabled, so a field disabled for another reason stays disabled.
 */
class CmsEntryFormFieldLockImpl implements Abstraction.Interface {
    private locked = false;
    private forms: WeakRef<IFormModel>[] = [];
    private fieldIds = new WeakMap<IFormModel, string[]>();
    private disabledByLock = new WeakMap<IFormModel, IField[]>();

    get isLocked(): boolean {
        return this.locked;
    }

    track(form: IFormModel, model: Pick<CmsModel, "fields">): void {
        this.forms.push(new WeakRef(form));
        this.fieldIds.set(
            form,
            model.fields.map(field => field.fieldId)
        );

        if (this.locked) {
            this.lock(form);
        }
    }

    setLocked(isLocked: boolean): void {
        if (this.locked === isLocked) {
            return;
        }
        this.locked = isLocked;

        const forms: IFormModel[] = [];
        for (const ref of this.forms) {
            const form = ref.deref();
            if (form) {
                forms.push(form);
            }
        }
        this.forms = forms.map(form => new WeakRef(form));

        for (const form of forms) {
            if (isLocked) {
                this.lock(form);
            } else {
                this.unlock(form);
            }
        }
    }

    private lock(form: IFormModel): void {
        const fields: IField[] = [];

        for (const fieldId of this.fieldIds.get(form) ?? []) {
            const field = this.findField(form, fieldId);
            if (field && !field.disabled) {
                fields.push(field);
            }
        }

        runInAction(() => {
            for (const field of fields) {
                field.setDisabled(true);
            }
        });
        this.disabledByLock.set(form, fields);
    }

    private unlock(form: IFormModel): void {
        const fields = this.disabledByLock.get(form) ?? [];

        runInAction(() => {
            for (const field of fields) {
                field.setDisabled(false);
            }
        });
        this.disabledByLock.delete(form);
    }

    /*
     * `form.field()` throws for a name the form does not have (a model field without a renderer
     * or left out of the layout).
     */
    private findField(form: IFormModel, fieldId: string): IField | null {
        try {
            return form.field(fieldId);
        } catch {
            return null;
        }
    }
}

export const CmsEntryFormFieldLock = Abstraction.createImplementation({
    implementation: CmsEntryFormFieldLockImpl,
    dependencies: []
});
