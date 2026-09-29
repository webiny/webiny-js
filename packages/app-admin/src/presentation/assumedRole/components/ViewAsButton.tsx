import React from "react";
import { useFeature } from "@webiny/app";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { createReactiveComponent } from "~/index.js";
import { useSnackbar } from "~/hooks/useSnackbar.js";
import { AssumedRolePresenterFeature } from "../feature.js";
import type { AssumedRolePresenter } from "../abstractions.js";

interface ViewAsButtonProps {
    // The saved role or team open in the form. `null` while the record is new or still loading.
    target: AssumedRolePresenter.Target | null;
}

/**
 * "View as this role" in the role and team forms, so the preview can be found where permissions are
 * edited rather than only in the command palette. Success reloads the page, so the only outcome
 * this has to show is a failure.
 */
export const ViewAsButton = createReactiveComponent(({ target }: ViewAsButtonProps) => {
    const { presenter } = useFeature(AssumedRolePresenterFeature);
    const { showSnackbar } = useSnackbar();
    const vm = presenter.vm;

    if (!target || !vm.canAssume) {
        return null;
    }

    const isPreviewed = vm.assumedRole?.type === target.type && vm.assumedRole.id === target.id;

    // Already previewing this one: say so, rather than leave a dead button that doesn't explain itself.
    let text = `View as this ${target.type}`;
    if (isPreviewed) {
        text = `Viewing as this ${target.type}`;
    }

    const viewAs = async () => {
        await presenter.assumeTarget(target);

        if (presenter.vm.error) {
            showSnackbar(presenter.vm.error);
            presenter.dismissError();
        }
    };

    return (
        <Button
            variant={"ghost"}
            icon={<VisibilityIcon />}
            text={text}
            disabled={vm.switching || isPreviewed}
            onClick={viewAs}
            data-testid={"admin.am.view-as"}
        />
    );
});
