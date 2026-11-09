import type { IEnvironment } from "./types.js";

export class Environment implements IEnvironment {
    public isPreview(): boolean {
        return this.getQueryParam("preview.document") !== null;
    }

    public isClient(): boolean {
        return typeof window !== "undefined";
    }

    public isServer(): boolean {
        return !this.isClient();
    }

    /**
     * In the Website Builder editor's preview. The CMS entry editor's live preview (`wb.type=entry`) is an
     * iframe too, but there the CMS SDK edits the entry: Website Builder content in it renders as live.
     * A page framed with `wb.preview=true` (a preview of the page inside another app, e.g. a simulator
     * around it) is a preview, not the editor's canvas: it renders the page itself instead of waiting
     * for the editor's document.
     */
    public isEditing(): boolean {
        if (!this.isClient() || window.parent === window) {
            return false;
        }

        return (
            this.getQueryParam("wb.type") !== "entry" && this.getQueryParam("wb.preview") !== "true"
        );
    }

    private getQueryParam(key: string): string | null {
        if (!this.isClient()) {
            return null;
        }

        return new URLSearchParams(window.location.search).get(key);
    }
}

export const environment = new Environment();
