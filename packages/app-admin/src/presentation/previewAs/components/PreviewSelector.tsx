import React, { useState } from "react";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";
import { useFeature } from "@webiny/app";
import { DropdownMenu } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { PreviewSelector as BasePreviewSelector } from "~/base/ui/PreviewSelector.js";
import { PreviewPresenterFeature } from "../feature.js";
import type { PreviewPresenter } from "../abstractions.js";

const renderGroup = (
    label: string,
    options: PreviewPresenter.Option[],
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
 * exiting and opening the next role's form. When nothing is being previewed this renders nothing
 * and the role and team forms are the way in, which keeps a feature used on setup days out of the
 * header on every other day.
 *
 * The options are already loaded by the time this can be opened: the presenter preloads them on
 * page load, but only when the page loaded into a preview.
 */
const PreviewSelectorView = createReactiveComponent(() => {
    const { presenter } = useFeature(PreviewPresenterFeature);
    const toast = useToast();
    const vm = presenter.vm;

    const [opened, setOpened] = useState(false);

    if (!vm.activePreview) {
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
        await presenter.previewAs(value);
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
                    data-testid={"preview-selector"}
                >
                    <Icon
                        label={"Previewing as"}
                        icon={<VisibilityIcon />}
                        className={"fill-neutral-xstrong"}
                    />
                    {vm.activePreview.name}
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

export const PreviewSelector = BasePreviewSelector.createDecorator(() => {
    return function PreviewSelector() {
        return <PreviewSelectorView />;
    };
});
