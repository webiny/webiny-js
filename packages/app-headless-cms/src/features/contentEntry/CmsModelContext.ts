import type { CmsModel } from "~/types.js";
import { CmsModelContext as Abstraction } from "~/features/contentEntry/abstractions.js";

class CmsModelContextImpl implements Abstraction.Interface {
    private _model: CmsModel | null = null;

    getModel(): CmsModel {
        if (!this._model) {
            throw new Error("CMS model not set on CmsModelContext.");
        }
        return this._model;
    }

    setModel(model: CmsModel): void {
        this._model = model;
    }
}

export const CmsModelContext = Abstraction.createImplementation({
    implementation: CmsModelContextImpl,
    dependencies: []
});
