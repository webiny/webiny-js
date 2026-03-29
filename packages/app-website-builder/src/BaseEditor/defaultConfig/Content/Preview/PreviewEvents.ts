import type { Messenger } from "@webiny/website-builder-sdk";
import {
    type BoxesData,
    type ComponentManifest,
    type EditorViewportInfo,
    functionConverter,
    mouseTracker,
    type PreviewViewportData,
    type SerializedComponentGroup
} from "@webiny/website-builder-sdk";
import defaultImage from "@webiny/icons/extension.svg";
import { Commands } from "~/BaseEditor/index.js";
import type { Editor } from "~/editorSdk/Editor.js";
import { $createElement } from "~/editorSdk/utils/index.js";

type FragmentConfig =
    | {
          type: "fixed";
          name: string;
          element: React.ReactNode;
      }
    | { type: "component"; component: string; inputs: Record<string, any> };

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function deserializeHandlers(value: string | string[]): Function | Function[] {
    if (Array.isArray(value)) {
        return value.map(s => functionConverter.deserialize(s));
    }
    return functionConverter.deserialize(value);
}

export class PreviewEvents {
    private editor: Editor;
    private editorEventsRegistered = false;
    private messenger: Messenger | undefined;
    private listeners: Array<() => void> = [];

    constructor(editor: Editor) {
        this.editor = editor;
    }

    onConnected(messenger: Messenger) {
        // Dispose of the old messenger.
        this.messenger?.dispose();

        this.messenger = messenger;

        this.registerEditorEvents();

        this.subscribeToIframe(messenger);

        setTimeout(() => {
            this.editor.updateEditor(state => {
                state.loadingPreview = false;
                state.selectedElement = null;
            });
        }, 100);
    }

    destroy() {
        this.listeners.forEach(unsubscribe => {
            unsubscribe();
        });
    }

    private registerEditorEvents() {
        if (this.editorEventsRegistered) {
            return;
        }

        this.editorEventsRegistered = true;

        this.listeners.push(
            // Propagate changes
            this.editor.onDocumentStateChange(event => {
                if (event.reason === "update") {
                    this.getMessenger().send("document.patch", event.diff);
                } else {
                    this.getMessenger().send("document.set", event.state);
                }
            }),

            // Element preview
            this.editor.registerCommandHandler(Commands.PreviewPatchElement, payload => {
                this.getMessenger().send(`element.patch.${payload.elementId}`, payload.patch);
            }),

            // Forward arbitrary messages to the preview iframe.
            this.editor.registerCommandHandler(Commands.SendPreviewMessage, ({ type, payload }) => {
                this.getMessenger().send(type, payload);
            })
        );
    }

    private subscribeToIframe(messenger: Messenger) {
        // When `onConnected` is executed, we need to send new data to the live preview.
        messenger.send("document.set", this.editor.getDocumentState().toJson());

        messenger.on("preview.theme", ({ theme }) => {
            this.editor.executeCommand(Commands.SetTheme, { theme });
        });

        messenger.on("document.fragments", payload => {
            const fragments: FragmentConfig[] = payload.fragments;
            this.editor.updateEditor(state => {
                state.fragments = fragments;
            });

            const document = this.editor.getDocumentState().read();

            if (Object.keys(document.elements).length === 1) {
                // We only have the default "root" element, create fragment elements.
                fragments.forEach((fragment, index) => {
                    if (fragment.type === "fixed") {
                        $createElement(this.editor, {
                            componentName: "Webiny/Fragment",
                            parentId: "root",
                            slot: "children",
                            index,
                            bindings: {
                                inputs: {
                                    name: fragment.name
                                }
                            }
                        });
                        return;
                    }

                    $createElement(this.editor, {
                        componentName: fragment.component,
                        parentId: "root",
                        slot: "children",
                        index,
                        bindings: {
                            inputs: fragment.inputs
                        }
                    });
                });
            }
        });

        messenger.on("preview.viewport", ({ boxes, viewport }: PreviewViewportData) => {
            const iframeBox = this.getIframeBox();

            this.editor.updateEditor(state => {
                state.viewport = {
                    ...state.viewport,
                    ...viewport,
                    top: iframeBox.top,
                    left: iframeBox.left
                };

                state.boxes = {
                    preview: boxes,
                    editor: this.mapCoordinatesToEditorSpace(state.viewport, boxes)
                };
            });
        });

        messenger.on("preview.component.register", (component: ComponentManifest) => {
            // Deserialize constraint check functions once on arrival.
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
                    `Couldn't deserialize ${component.name} component callbacks:`,
                    e.message
                );
            }

            this.editor.updateEditor(state => {
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

        messenger.on("preview.componentGroup.register", (group: SerializedComponentGroup) => {
            this.editor.updateEditor(state => {
                if (!state.componentGroups) {
                    state.componentGroups = {};
                }
                state.componentGroups[group.name] = group;
            });
        });

        messenger.on("preview.element.click", ({ id }) => {
            this.editor.updateEditor(state => {
                state.selectedElement = id;
            });
        });

        messenger.on("preview.mouse.move", ({ x, y }) => {
            const iframeBox = this.getIframeBox();
            const globalX = x + iframeBox.left;
            const globalY = y + iframeBox.top;

            mouseTracker.setPosition(globalX, globalY);
        });
    }

    private getIframeBox() {
        const previewContainer = document.getElementById("preview-container");
        const previewBody = document.getElementById("preview-body");

        if (!previewContainer || !previewBody) {
            return {
                top: 0,
                left: 0,
                width: 0,
                height: 0
            };
        }

        /**
         * We need to use the `preview-container` to get the exact position from the top (we MUST ignore scroll position).
         * However, for everything else we use the actual `preview-body`,
         */
        const containerRect = previewContainer.getBoundingClientRect();
        const bodyRect = previewBody.getBoundingClientRect();

        return {
            top: containerRect.top,
            left: bodyRect.left,
            width: bodyRect.width,
            height: bodyRect.height
        };
    }

    private mapCoordinatesToEditorSpace(
        viewport: EditorViewportInfo,
        boxes: PreviewViewportData["boxes"]
    ) {
        const newBoxes: BoxesData = {};

        for (const key in boxes) {
            const box = boxes[key];
            newBoxes[key] = {
                ...box,
                top: box.top + viewport.top,
                left: box.left + viewport.left
            };
        }

        return newBoxes;
    }

    private getMessenger(): Messenger {
        return this.messenger!;
    }
}
