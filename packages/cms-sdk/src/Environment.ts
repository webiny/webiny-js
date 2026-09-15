import type { IEnvironment } from "./types.js";

class EnvironmentImpl implements IEnvironment {
    isClient(): boolean {
        return typeof window !== "undefined";
    }

    isServer(): boolean {
        return !this.isClient();
    }

    isEditing(): boolean {
        if (!this.isClient() || window.parent === window) {
            return false;
        }
        const params = new URLSearchParams(window.location.search);
        return params.get("wb.type") === "entry";
    }
}

export const environment = new EnvironmentImpl();
