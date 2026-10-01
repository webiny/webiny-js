import type React from "react";
import type { PermissionRendererConfig } from "~/permissions/types.js";
import type { AssumedRolePresenter } from "~/presentation/assumedRole/abstractions.js";

export interface AppAccess {
    name: string;
    title: string;
    icon: React.ReactElement | undefined;
    prefix: string;
}

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

export function grantedApps(option: AssumedRolePresenter.Option, apps: AppAccess[]): AppAccess[] {
    return apps.filter(app => {
        return option.permissionNames.some(name => {
            return name === `${app.prefix}.*` || name.startsWith(`${app.prefix}.`);
        });
    });
}
