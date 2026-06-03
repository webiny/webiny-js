import type { CmsModel } from "~/types.js";
import { CmsModelAccessor as Abstraction } from "~/features/contentEntry/abstractions.js";

class CmsModelAccessorImpl implements Abstraction.Interface {
    private _model: CmsModel | null = null;

    getModel(): CmsModel {
        if (!this._model) {
            throw new Error("CMS model not set on CmsModelAccessor.");
        }
        return this._model;
    }

    setModel(model: CmsModel): void {
        this._model = model;
    }
}

export const CmsModelAccessor = Abstraction.createImplementation({
    implementation: CmsModelAccessorImpl,
    dependencies: []
});
