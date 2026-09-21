import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { DropdownMenu, Icon, useToast } from "@webiny/admin-ui";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { useIdentity } from "~/presentation/security/hooks/useIdentity.js";
import { AssumedRolePresenterFeature } from "../feature.js";
import type { AssumedRolePresenter } from "../abstractions.js";

const renderGroup = (
    label: string,
    options: AssumedRolePresenter.Option[],
    onPick: (value: string) => void
) => {
    if (options.length === 0) {
        return null;
    }

    return (
        <DropdownMenu.Group key={label}>
            <DropdownMenu.Label text={label} />
            {options.map(option => (
                <DropdownMenu.Item
                    key={option.value}
                    text={option.label}
                    onClick={() => onPick(option.value)}
                />
            ))}
        </DropdownMenu.Group>
    );
};

/**
 * Header control for previewing the Admin as a role or team, sitting beside the tenant indicator
 * because it answers the same kind of question: whose view of the Admin am I looking at?
 */
export const AssumedRoleSelector = observer(() => {
    const { presenter } = useFeature(AssumedRolePresenterFeature);
    const { identity } = useIdentity();
    const toast = useToast();
    const vm = presenter.vm;

    const [opened, setOpened] = useState(false);

    /*
     * While previewing, the identity no longer holds "*", so the full-access check alone would
     * hide the control and strand whoever started the preview. An active preview keeps it visible.
     */
    const hasFullAccess = identity.getPermission("*", true) !== null;
    if (!hasFullAccess && !vm.assumedRole) {
        return null;
    }

    const reportError = () => {
        if (!presenter.vm.error) {
            return;
        }

        toast.showWarningToast({ title: presenter.vm.error });
        presenter.dismissError();
    };

    const onOpenChange = (open: boolean) => {
        setOpened(open);

        /*
         * Don't list roles while previewing: the previewed role usually cannot read the role list,
         * so the request would fail and the only useful action left is to exit.
         */
        if (open && !vm.assumedRole) {
            presenter.load();
        }
    };

    const pick = async (value: string) => {
        await presenter.assume(value);
        reportError();
    };

    const exit = async () => {
        await presenter.exit();
        reportError();
    };

    const label = vm.assumedRole ? vm.assumedRole.name : "View as";

    return (
        <DropdownMenu
            open={opened}
            onOpenChange={onOpenChange}
            className={"w-[240px]"}
            trigger={
                <div
                    className={"flex items-center gap-x-xs cursor-pointer"}
                    data-testid={"assumed-role-selector"}
                >
                    <Icon
                        label={"View as"}
                        icon={<VisibilityIcon />}
                        className={"fill-neutral-xstrong"}
                    />
                    {label}
                </div>
            }
        >
            {vm.assumedRole ? (
                <DropdownMenu.Item text={"Exit preview"} onClick={exit} disabled={vm.switching} />
            ) : null}
            {!vm.assumedRole && vm.loading ? <DropdownMenu.Label text={"Loading..."} /> : null}
            {vm.assumedRole ? null : renderGroup("Roles", vm.roleOptions, pick)}
            {vm.assumedRole ? null : renderGroup("Teams", vm.teamOptions, pick)}
        </DropdownMenu>
    );
});
