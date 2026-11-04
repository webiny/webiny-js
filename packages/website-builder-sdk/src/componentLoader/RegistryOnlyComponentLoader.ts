import type { Component } from "~/types.js";
import type { ComponentLoader } from "./ComponentLoader.js";

/**
 * The loader used when neither the config nor a framework integration provides one. It loads
 * nothing, so only components registered with `registerComponent` render.
 */
export class RegistryOnlyComponentLoader implements ComponentLoader {
    async loadComponent(): Promise<Component | null> {
        return null;
    }
}
