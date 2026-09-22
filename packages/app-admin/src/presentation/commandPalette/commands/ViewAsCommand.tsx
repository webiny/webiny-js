import React, { useEffect } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { Alert, Icon } from "@webiny/admin-ui";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { Permission } from "~/features/accessManagement/constants.js";
import { useIdentity } from "~/presentation/security/hooks/useIdentity.js";
import { AssumedRolePresenterFeature } from "~/presentation/assumedRole/feature.js";
import type { AssumedRolePresenter } from "~/presentation/assumedRole/abstractions.js";
import { Command } from "../abstractions.js";

const ITEM_CLASS =
    "flex cursor-pointer select-none items-center gap-sm rounded-sm px-sm py-xs-plus text-md " +
    "text-neutral-primary outline-none data-[selected=true]:bg-neutral-dimmed";

const HEADING_CLASS =
    "px-sm py-xs text-sm text-neutral-strong [&_[cmdk-group-heading]]:px-sm " +
    "[&_[cmdk-group-heading]]:py-xs [&_[cmdk-group-heading]]:text-sm";

const renderGroup = (
    heading: string,
    options: AssumedRolePresenter.Option[],
    onPick: (value: string) => void
) => {
    if (options.length === 0) {
        return null;
    }

    return (
        <CommandPrimitive.Group heading={heading} className={HEADING_CLASS}>
            {options.map(option => (
                <CommandPrimitive.Item
                    key={option.value}
                    value={`${heading} ${option.label}`}
                    onSelect={() => onPick(option.value)}
                    className={ITEM_CLASS}
                >
                    {option.label}
                </CommandPrimitive.Item>
            ))}
        </CommandPrimitive.Group>
    );
};

/**
 * Lives in the palette rather than in the header. Previewing a role is something you reach for
 * while setting up permissions, not on a normal day, so it does not earn permanent chrome.
 *
 * Renders its own cmdk list so the roles are searchable and reachable with the arrow keys, the
 * same as the palette's own list. Safe to nest: the palette swaps its list out for the detail
 * view, so only one cmdk root is ever mounted.
 */
const ViewAsDetailView = observer(({ onClose }: Command.DetailProps) => {
    const { presenter } = useFeature(AssumedRolePresenterFeature);
    const { identity } = useIdentity();
    const vm = presenter.vm;

    const canManageRoles = identity.getPermissions(Permission.Roles).length > 0;

    useEffect(() => {
        if (canManageRoles) {
            presenter.load();
        }
    }, [presenter, canManageRoles]);

    if (!canManageRoles) {
        return (
            <div className={"p-md"}>
                <Alert type={"info"} variant={"subtle"}>
                    {"Previewing a role needs permission to manage roles."}
                </Alert>
            </div>
        );
    }

    const pick = (value: string) => {
        onClose();
        void presenter.assume(value);
    };

    const exit = () => {
        onClose();
        void presenter.exit();
    };

    return (
        <CommandPrimitive
            label={"View as role or team"}
            style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
            <div className={"flex-none border-b border-neutral-subtle px-md py-sm-plus"}>
                <CommandPrimitive.Input
                    autoFocus
                    placeholder={"Search roles and teams..."}
                    className={
                        "w-full bg-transparent text-md text-neutral-primary outline-none " +
                        "placeholder:text-neutral-light"
                    }
                />
            </div>

            {vm.error ? (
                <div className={"px-md pt-sm"}>
                    <Alert type={"danger"} variant={"subtle"}>
                        {vm.error}
                    </Alert>
                </div>
            ) : null}

            <CommandPrimitive.List
                style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
                className={"p-sm"}
            >
                {vm.loading ? (
                    <CommandPrimitive.Loading className={"px-sm py-xs text-md text-neutral-strong"}>
                        {"Loading roles..."}
                    </CommandPrimitive.Loading>
                ) : null}

                <CommandPrimitive.Empty className={"px-sm py-xs text-md text-neutral-strong"}>
                    {"No roles or teams match."}
                </CommandPrimitive.Empty>

                {vm.assumedRole ? (
                    <CommandPrimitive.Item
                        value={`Exit preview ${vm.assumedRole.name}`}
                        onSelect={exit}
                        className={ITEM_CLASS}
                    >
                        <Icon
                            icon={<CloseIcon />}
                            size={"sm"}
                            color={"neutral-strong"}
                            label={""}
                        />
                        {`Exit preview of "${vm.assumedRole.name}"`}
                    </CommandPrimitive.Item>
                ) : null}

                {renderGroup("Roles", vm.roleOptions, pick)}
                {renderGroup("Teams", vm.teamOptions, pick)}
            </CommandPrimitive.List>
        </CommandPrimitive>
    );
});

class ViewAsCommandImpl implements Command.Interface {
    name = "admin.viewAs";
    label = "View as role or team";
    description = "Browse the Admin with someone else's permissions";
    category = "Actions";
    keywords = ["role", "team", "permissions", "preview", "impersonate", "assume"];
    icon = <Icon icon={<VisibilityIcon />} size="sm" color="neutral-strong" label="" />;
    detailView = ViewAsDetailView;
}

export const ViewAsCommand = Command.createImplementation({
    implementation: ViewAsCommandImpl,
    dependencies: []
});
