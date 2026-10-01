import React from "react";
import { useCommandState } from "cmdk";
import { cn } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as FullAccessIcon } from "@webiny/icons/admin_panel_settings.svg";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import type { AssumedRolePresenter } from "~/presentation/assumedRole/abstractions.js";
import { grantedApps } from "./appAccess.js";
import type { AppAccess } from "./appAccess.js";

interface ChipProps {
    icon?: React.ReactElement;
    label: string;
    warning?: boolean;
}

const Chip = ({ icon, label, warning }: ChipProps) => {
    let tone = "border-neutral-dimmed bg-neutral-base";
    if (warning) {
        tone = "border-transparent bg-warning-subtle";
    }

    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center gap-xxs rounded-sm border px-xs text-sm text-neutral-strong",
                tone
            )}
        >
            {icon && (
                <Icon
                    icon={icon}
                    size={"xs"}
                    color={"neutral-strong"}
                    className={warning ? "fill-warning" : undefined}
                    label={""}
                />
            )}
            {label}
        </span>
    );
};

interface CanAccessProps {
    options: AssumedRolePresenter.Option[];
    apps: AppAccess[];
}

/*
 * What the highlighted role can reach, so picking one is an informed choice rather than a guess from
 * its name. Reads the highlighted row from cmdk, so it follows the arrow keys with no state here.
 */
export const CanAccess = ({ options, apps }: CanAccessProps) => {
    const value = useCommandState(state => state.value);
    const option = options.find(item => item.value === value);

    if (!option) {
        return null;
    }

    const chips: React.ReactNode[] = [];

    // "Everything" rather than every app by name: full access also covers apps with no renderer.
    if (option.fullAccess) {
        chips.push(<Chip key={"everything"} icon={<FullAccessIcon />} label={"Everything"} />);
    } else {
        for (const app of grantedApps(option, apps)) {
            chips.push(<Chip key={app.name} icon={app.icon} label={app.title} />);
        }
    }

    if (chips.length === 0) {
        chips.push(
            <Text key={"none"} size="sm" className="text-neutral-muted">
                {"No apps"}
            </Text>
        );
    }

    if (option.readOnly) {
        chips.push(<Chip key={"read-only"} icon={<LockIcon />} label={"Read-only"} warning />);
    }

    return (
        <div className="flex flex-none flex-wrap items-center gap-xs border-t border-neutral-subtle px-md py-sm">
            <Text size="sm" className="text-neutral-muted">
                {"Can access"}
            </Text>
            {chips}
        </div>
    );
};
