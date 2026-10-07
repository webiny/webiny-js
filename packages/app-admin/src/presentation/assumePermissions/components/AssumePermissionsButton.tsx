import React from "react";
import { useFeature } from "@webiny/app";
import { Button } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";
import { useSnackbar } from "~/hooks/useSnackbar.js";
import { AssumePermissionsPresenterFeature } from "../feature.js";
import type { AssumePermissionsPresenter } from "../abstractions.js";

/*
 * What happens on click, said before the click. The last sentence matters most: a preview is not a
 * sandbox, so anything the role is allowed to save is saved for real.
 */
function tooltipText(type: AssumePermissionsPresenter.Target["type"]): string {
    return `Reloads the Admin with only this ${type}'s permissions, so you see what its users see. Exit from the banner at the top. Anything you save while previewing is saved for real.`;
}

interface AssumePermissionsButtonProps {
    // The saved role or team open in the form. `null` while the record is new or still loading.
    target: AssumePermissionsPresenter.Target | null;
}

/**
 * "View as this role" in the role and team forms. This is where a preview starts: next to where the
 * permissions are edited. Success reloads the page, so the only outcome this has to show is a
 * failure.
 */
export const AssumePermissionsButton = createReactiveComponent(
    ({ target }: AssumePermissionsButtonProps) => {
        const { presenter } = useFeature(AssumePermissionsPresenterFeature);
        const { showSnackbar } = useSnackbar();
        const vm = presenter.vm;

        if (!target || !vm.canAssume) {
            return null;
        }

        const isAssumed = vm.assumed?.type === target.type && vm.assumed.id === target.id;

        // Already previewing this one: say so, rather than leave a dead button with no reason.
        let text = `View as this ${target.type}`;
        if (isAssumed) {
            text = `Viewing as this ${target.type}`;
        }

        const assume = async () => {
            await presenter.assumeTarget(target);

            if (presenter.vm.error) {
                showSnackbar(presenter.vm.error);
                presenter.dismissError();
            }
        };

        const button = (
            <Button
                variant={"ghost"}
                icon={<VisibilityIcon />}
                text={text}
                disabled={vm.switching || isAssumed}
                onClick={assume}
                data-testid={"admin.am.view-as"}
            />
        );

        // The label already explains a disabled button, and a disabled button gets no hover anyway.
        if (isAssumed) {
            return button;
        }

        return <Tooltip content={tooltipText(target.type)} trigger={button} />;
    }
);
