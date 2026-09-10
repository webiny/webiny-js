import { makeAutoObservable, computed } from "mobx";
import {
    LivePreviewPresenter as Abstraction,
    type ILivePreviewPresenter,
    type PreviewComponent
} from "./abstractions.js";

class LivePreviewPresenterImpl implements ILivePreviewPresenter {
    private components: PreviewComponent[] = [];

    constructor() {
        makeAutoObservable(this, { vm: computed });
    }

    get vm() {
        return {
            components: this.components
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
}

export const LivePreviewPresenter = Abstraction.createImplementation({
    implementation: LivePreviewPresenterImpl,
    dependencies: []
});
