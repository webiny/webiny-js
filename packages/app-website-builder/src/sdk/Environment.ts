import { IEnvironment } from "./types.js";

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

    public isEditing(): boolean {
        return this.isClient() && window.parent !== window;
    }

    private getQueryParam(key: string): string | null {
        if (!this.isClient()) {
            return null;
        }

        return new URLSearchParams(window.location.search).get(key);
    }
}

export const environment = new Environment();
