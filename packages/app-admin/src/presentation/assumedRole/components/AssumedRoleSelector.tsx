import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { DropdownMenu } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { AssumedRoleSelector as BaseAssumedRoleSelector } from "~/base/ui/AssumedRoleSelector.js";
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
 * Shown only while a preview is active, so that comparing two roles is one click rather than
 * exit-reopen-search. When nothing is being previewed this renders nothing and the palette is the
 * only way in, which is what keeps a feature used on setup days out of the header on every other
 * day.
 *
 * The options are already loaded by the time this can be opened: the presenter preloads them on
 * page load, but only when the page loaded into a preview.
 */
const AssumedRoleSelectorView = observer(() => {
    const { presenter } = useFeature(AssumedRolePresenterFeature);
    const toast = useToast();
    const vm = presenter.vm;

    const [opened, setOpened] = useState(false);

    if (!vm.assumedRole) {
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

        if (open) {
            // Refreshes in the background; the list stays on screen while it does.
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
                        label={"Previewing as"}
                        icon={<VisibilityIcon />}
                        className={"fill-neutral-xstrong"}
                    />
                    {vm.assumedRole.name}
                </div>
            }
        >
            <DropdownMenu.Item text={"Exit preview"} onClick={exit} disabled={vm.switching} />
            <DropdownMenu.Separator />
            {renderGroup("Roles", vm.roleOptions, pick)}
            {renderGroup("Teams", vm.teamOptions, pick)}
        </DropdownMenu>
    );
});

export const AssumedRoleSelector = BaseAssumedRoleSelector.createDecorator(() => {
    return function AssumedRoleSelector() {
        return <AssumedRoleSelectorView />;
    };
});
