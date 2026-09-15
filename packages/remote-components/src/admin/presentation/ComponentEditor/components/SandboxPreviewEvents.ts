import type { Messenger } from "@webiny/website-builder-sdk";
import { functionConverter } from "@webiny/website-builder-sdk";
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import { Commands } from "@webiny/app-website-builder/BaseEditor/index.js";
import type { Editor } from "@webiny/app-website-builder/editorSdk/Editor.js";
import defaultImage from "@webiny/icons/extension.svg";
import {
    EditorProvider,
    SandboxPreviewEvents as SandboxPreviewEventsAbstraction
} from "../abstractions.js";

// oxlint-disable-next-line typescript/no-unsafe-function-type
function deserializeHandlers(value: string | string[]): Function | Function[] {
    if (Array.isArray(value)) {
        return value.map(s => functionConverter.deserialize(s));
    }
    return functionConverter.deserialize(value);
}

class SandboxPreviewEventsImpl implements SandboxPreviewEventsAbstraction.Interface {
    private editorEventsRegistered = false;
    private messenger: Messenger | undefined;
    private listeners: Array<() => void> = [];
    private connectCallbacks: Array<() => void> = [];

    constructor(private editorProvider: EditorProvider.Interface) {}

    get isConnected(): boolean {
        return this.messenger !== undefined;
    }

    onConnect(callback: () => void): () => void {
        this.connectCallbacks.push(callback);
        return () => {
            this.connectCallbacks = this.connectCallbacks.filter(cb => cb !== callback);
        };
    }

    onConnected(messenger: Messenger) {
        this.messenger?.dispose();
        this.messenger = messenger;
        this.registerEditorEvents();
        this.subscribeToIframe(messenger);
        this.connectCallbacks.forEach(cb => cb());
    }

    sendBundle(params: { componentName: string; bundledJs: string; bundledCss: string }) {
        if (!this.messenger) {
            return;
        }
        this.messenger.send("sandbox.component.bundle", {
            name: params.componentName,
            bundledJs: params.bundledJs,
            bundledCss: params.bundledCss
        });
    }

    sendLiveCss(params: { css: string; componentName: string }) {
        if (!this.messenger) {
            return;
        }
        this.messenger.send("sandbox.component.css", {
            css: params.css,
            componentName: params.componentName
        });
    }

    sendDocument() {
        const editor = this.getEditorOrNull();
        if (!this.messenger || !editor) {
            return;
        }
        this.messenger.send("document.set", editor.getDocumentState().toJson());
    }

    destroy() {
        this.listeners.forEach(fn => fn());
    }

    private getEditorOrNull(): Editor | null {
        return this.editorProvider.getEditor();
    }

    private registerEditorEvents() {
        const editor = this.getEditorOrNull();
        if (this.editorEventsRegistered || !editor) {
            return;
        }
        this.editorEventsRegistered = true;

        this.listeners.push(
            editor.onDocumentStateChange(event => {
                if (event.reason === "update") {
                    this.getMessenger().send("document.patch", event.diff);
                } else {
                    this.getMessenger().send("document.set", event.state);
                }
            }),
            editor.registerCommandHandler(Commands.PreviewPatchElement, payload => {
                this.getMessenger().send(`element.patch.${payload.elementId}`, payload.patch);
            })
        );
    }

    private subscribeToIframe(messenger: Messenger) {
        const editor = this.getEditorOrNull();
        if (!editor) {
            return;
        }

        messenger.send("document.set", editor.getDocumentState().toJson());

        messenger.on("preview.theme", ({ theme }) => {
            editor.executeCommand(Commands.SetTheme, { theme });
        });

        messenger.on("preview.component.register", (component: ComponentManifest) => {
            try {
                if (component.constraints) {
                    component.constraints = (component.constraints as any[]).map(c =>
                        typeof c === "string" ? functionConverter.deserialize(c) : c
                    );
                }
                if (component.descendantConstraints) {
                    component.descendantConstraints = (
                        component.descendantConstraints as any[]
                    ).map(c => (typeof c === "string" ? functionConverter.deserialize(c) : c));
                }
                if (component.canDelete && typeof component.canDelete === "string") {
                    component.canDelete = functionConverter.deserialize(component.canDelete);
                }
                if (component.onChange) {
                    component.onChange = deserializeHandlers(component.onChange as any) as any;
                }
                if (component.onDescendantChange) {
                    component.onDescendantChange = deserializeHandlers(
                        component.onDescendantChange as any
                    ) as any;
                }
            } catch (e) {
                console.log(
                    `Couldn't deserialize ${component.name} callbacks:`,
                    (e as Error).message
                );
            }

            editor.updateEditor(state => {
                if (!state.components) {
                    state.components = {};
                }
                state.components[component.name] = {
                    ...component,
                    image: component.image ?? defaultImage,
                    tags: component.tags ?? []
                };
            });
        });
    }

    private getMessenger(): Messenger {
        return this.messenger!;
    }
}

export const SandboxPreviewEvents = SandboxPreviewEventsAbstraction.createImplementation({
    implementation: SandboxPreviewEventsImpl,
    dependencies: [EditorProvider]
});
