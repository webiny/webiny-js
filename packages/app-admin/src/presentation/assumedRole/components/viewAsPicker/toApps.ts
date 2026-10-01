import type { PermissionRendererConfig } from "~/permissions/types.js";
import type { AppAccess } from "./types.js";

/*
 * The apps a role can reach, named the way the role editor names them. Built from the same
 * permission renderers the editor shows, so a new app shows up here without anyone touching this
 * file. Most renderers declare a schema with a prefix. The Headless CMS one renders a custom element
 * instead, but registers under the same name as its prefix, so the name is the fallback.
 */
export function toApps(renderers: PermissionRendererConfig[]): AppAccess[] {
    const seen = new Set<string>();
    const apps: AppAccess[] = [];

    for (const renderer of renderers) {
        if (seen.has(renderer.name)) {
            continue;
        }
        seen.add(renderer.name);

        apps.push({
            name: renderer.name,
            title: renderer.title,
            icon: renderer.icon,
            prefix: renderer.schema?.prefix ?? renderer.name
        });
    }

    return apps;
}
