import { makeAutoObservable, computed, runInAction } from "mobx";
import { GetModelUseCase } from "~/features/model/getModel/abstractions.js";
import { GetEntryUseCase } from "~/features/contentEntry/getEntry/abstractions.js";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import {
    LivePreviewPresenter as Abstraction,
    type ILivePreviewPresenter,
    type PreviewComponent
} from "./abstractions.js";
import type { RefValuesMap } from "./resolvePreviewUrl.js";

class LivePreviewPresenterImpl implements ILivePreviewPresenter {
    private components: PreviewComponent[] = [];
    private refValues: RefValuesMap = {};
    private requestedRefs = new Set<string>();

    constructor(
        private readonly getModelUseCase: GetModelUseCase.Interface,
        private readonly getEntryUseCase: GetEntryUseCase.Interface
    ) {
        makeAutoObservable<
            LivePreviewPresenterImpl,
            "getModelUseCase" | "getEntryUseCase" | "requestedRefs"
        >(this, {
            vm: computed,
            getModelUseCase: false,
            getEntryUseCase: false,
            requestedRefs: false
        });
    }

    get vm() {
        return {
            components: this.components,
            refValues: this.refValues
        };
    }

    addComponent(component: PreviewComponent): void {
        const exists = this.components.some(c => c.name === component.name);
        if (exists) {
            this.components = this.components.map(c => (c.name === component.name ? component : c));
        } else {
            this.components = [...this.components, component];
        }
    }

    clearComponents(): void {
        this.components = [];
    }

    loadRefValues(refs: CmsReferenceValue[]): void {
        for (const ref of refs) {
            if (this.requestedRefs.has(ref.id)) {
                continue;
            }
            this.requestedRefs.add(ref.id);
            void this.loadRef(ref);
        }
    }

    private async loadRef(ref: CmsReferenceValue): Promise<void> {
        try {
            const model = await this.getModelUseCase.execute({ modelId: ref.modelId });
            const entry = await this.getEntryUseCase.execute({ model, id: ref.id });
            runInAction(() => {
                this.refValues = { ...this.refValues, [ref.id]: entry.values ?? {} };
            });
        } catch {
            runInAction(() => {
                this.refValues = { ...this.refValues, [ref.id]: null };
            });
        }
    }
}

export const LivePreviewPresenter = Abstraction.createImplementation({
    implementation: LivePreviewPresenterImpl,
    dependencies: [GetModelUseCase, GetEntryUseCase]
});
