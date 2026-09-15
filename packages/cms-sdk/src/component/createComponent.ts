import type { Component, ComponentManifest } from "./types.js";

export function createComponent<T>(component: T, manifest: ComponentManifest): Component {
    return {
        component,
        manifest
    };
}
