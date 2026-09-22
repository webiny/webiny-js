import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { Alert, Button, Icon, Loader } from "@webiny/admin-ui";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { Permission } from "~/features/accessManagement/constants.js";
import { useIdentity } from "~/presentation/security/hooks/useIdentity.js";
import { AssumedRolePresenterFeature } from "~/presentation/assumedRole/feature.js";
import type { AssumedRolePresenter } from "~/presentation/assumedRole/abstractions.js";
import { Command } from "../abstractions.js";

const OptionList = ({
    label,
    options,
    onPick
}: {
    label: string;
    options: AssumedRolePresenter.Option[];
    onPick: (value: string) => void;
}) => {
    if (options.length === 0) {
        return null;
    }

    return (
        <div className={"flex flex-col gap-xxs"}>
            <div className={"text-sm text-neutral-strong px-xs"}>{label}</div>
            {options.map(option => (
                <Button
                    key={option.value}
                    variant={"ghost"}
                    text={option.label}
                    className={"justify-start"}
                    onClick={() => onPick(option.value)}
                />
            ))}
        </div>
    );
};

/**
 * Lives in the palette rather than in the header. Previewing a role is something you reach for
 * while setting up permissions, not on a normal day, so it does not earn permanent chrome. While
 * a preview IS active the banner carries the role name and the way out, so nothing is hidden.
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

    const pick = async (value: string) => {
        onClose();
        await presenter.assume(value);
    };

    const exit = async () => {
        onClose();
        await presenter.exit();
    };

    return (
        <div className={"flex flex-col gap-sm p-md"}>
            {vm.error ? (
                <Alert type={"danger"} variant={"subtle"}>
                    {vm.error}
                </Alert>
            ) : null}

            {vm.assumedRole ? (
                <Button
                    variant={"secondary"}
                    text={`Exit preview of "${vm.assumedRole.name}"`}
                    disabled={vm.switching}
                    onClick={exit}
                />
            ) : null}

            {vm.loading ? <Loader /> : null}

            <OptionList label={"Roles"} options={vm.roleOptions} onPick={pick} />
            <OptionList label={"Teams"} options={vm.teamOptions} onPick={pick} />
        </div>
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
