import type { AssumedRolePresenter } from "~/presentation/assumedRole/abstractions.js";
import type { AppAccess } from "./types.js";

// The apps this option's permissions reach, by permission name prefix.
export function grantedApps(option: AssumedRolePresenter.Option, apps: AppAccess[]): AppAccess[] {
    return apps.filter(app => {
        return option.permissionNames.some(name => {
            return name === `${app.prefix}.*` || name.startsWith(`${app.prefix}.`);
        });
    });
}
