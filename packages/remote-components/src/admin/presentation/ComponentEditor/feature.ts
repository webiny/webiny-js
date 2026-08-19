import { createFeature } from "@webiny/feature/admin";
import {
    ComponentEditorPresenter as PresenterAbstraction,
    EditorProvider as EditorProviderAbstraction,
    SandboxPreviewEvents as SandboxPreviewEventsAbstraction
} from "./abstractions.js";
import { ComponentEditorPresenter } from "./ComponentEditorPresenter.js";
import { EditorProvider } from "./EditorProvider.js";
import { SandboxPreviewEvents } from "./components/SandboxPreviewEvents.js";

export const ComponentEditorFeature = createFeature({
    name: "RemoteComponents/ComponentEditor",
    register(container) {
        container.register(EditorProvider).inSingletonScope();
        container.register(SandboxPreviewEvents).inSingletonScope();
        container.register(ComponentEditorPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction),
            editorProvider: container.resolve(EditorProviderAbstraction),
            previewEvents: container.resolve(SandboxPreviewEventsAbstraction)
        };
    }
});
