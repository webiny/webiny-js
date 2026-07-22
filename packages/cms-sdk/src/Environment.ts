import type { IEnvironment } from "./types.js";

class EnvironmentImpl implements IEnvironment {
    isClient(): boolean {
        return typeof window !== "undefined";
    }

    isServer(): boolean {
        return !this.isClient();
    }

    isEditing(): boolean {
        return this.isClient() && window.parent !== window;
    }
}

export const environment = new EnvironmentImpl();
