import { Messenger, MessageOrigin } from "./messenger/index.js";
import type { ComponentManifest } from "./component/types.js";

export class EditorBridge {
    private messenger: Messenger;

    constructor(iframe: HTMLIFrameElement) {
        const editorOrigin = new MessageOrigin(() => window, window.location.origin);
        const previewOrigin = new MessageOrigin(
            () => iframe.contentWindow!,
            new URL(iframe.src).origin
        );

        this.messenger = new Messenger(editorOrigin, previewOrigin, "wb.editor.*");
    }

    onReady(handler: () => void): () => void {
        return this.messenger.on("preview.ready", handler);
    }

    onComponentRegister(handler: (manifest: ComponentManifest) => void): () => void {
        return this.messenger.on("preview.component.register", handler);
    }

    sendEntryUpdate(data: Record<string, unknown>): void {
        this.messenger.send("document.set", data);
    }

    sendEntryPatch(patch: unknown[]): void {
        this.messenger.send("document.patch", patch);
    }

    dispose(): void {
        this.messenger.dispose();
    }
}
