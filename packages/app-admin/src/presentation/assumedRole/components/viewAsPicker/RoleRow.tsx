import React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { useCommandState } from "cmdk";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { ReactComponent as FullAccessIcon } from "@webiny/icons/admin_panel_settings.svg";
import { ReactComponent as TeamIcon } from "@webiny/icons/groups.svg";
import { ReactComponent as RoleIcon } from "@webiny/icons/badge.svg";
import type { AssumedRolePresenter } from "~/presentation/assumedRole/abstractions.js";
import { grantedApps } from "./grantedApps.js";
import type { AppAccess } from "./types.js";
import { EnterPill } from "./EnterPill.js";
import { ROW_CLASS_NAME } from "./rowClassName.js";
import { Tile } from "./Tile.js";

function rowIcon(option: AssumedRolePresenter.Option, granted: AppAccess[]): React.ReactElement {
    if (option.fullAccess) {
        return <FullAccessIcon />;
    }

    if (option.type === "team") {
        return <TeamIcon />;
    }

    if (option.readOnly) {
        return <VisibilityIcon />;
    }

    const withIcon = granted.find(app => app.icon);
    if (withIcon?.icon) {
        return withIcon.icon;
    }

    return <RoleIcon />;
}

interface RoleRowProps {
    option: AssumedRolePresenter.Option;
    apps: AppAccess[];
    onPick: (value: string) => void;
}

export const RoleRow = ({ option, apps, onPick }: RoleRowProps) => {
    const selected = useCommandState(state => state.value === option.value);
    const granted = grantedApps(option, apps);
    const icon = rowIcon(option, granted);

    return (
        <CommandPrimitive.Item
            value={option.value}
            keywords={[option.label, option.description, option.type]}
            onSelect={() => onPick(option.value)}
            className={ROW_CLASS_NAME}
        >
            <Tile selected={selected} icon={icon} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-xs">
                    <Text as="div" size="md" className="truncate font-medium text-neutral-primary">
                        {option.label}
                    </Text>
                    {option.isCurrent && (
                        <span className="shrink-0 rounded-sm bg-neutral-dimmed px-xs text-xs font-semibold text-neutral-strong">
                            {`Your ${option.type}`}
                        </span>
                    )}
                </div>
                {option.description && (
                    <Text as="div" size="sm" className="truncate text-neutral-muted">
                        {option.description}
                    </Text>
                )}
            </div>
            {selected && <EnterPill verb={"View as"} />}
        </CommandPrimitive.Item>
    );
};
