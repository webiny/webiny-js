import React from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";
import { Banner } from "~/presentation/banners/components/Banner.js";
import { AssumePermissionsPresenterFeature } from "../feature.js";

/**
 * Shows the preview banner for as long as a preview is active. It is deliberately not dismissible:
 * writes fail while previewing, and someone who has lost the banner has no way to explain why.
 *
 * Mounted outside every permission gate, because the previewed role usually cannot see the menu
 * the preview was started from. Leaving it behind a gate would strand the user.
 */
export const AssumedPermissionsBanner = createReactiveComponent(() => {
    const { presenter } = useFeature(AssumePermissionsPresenterFeature);
    const { assumed, switching } = presenter.vm;

    if (!assumed) {
        return null;
    }

    const action = { label: "Exit preview", disabled: switching, onClick: presenter.exit };

    return (
        <Banner
            id={"assume-permissions"}
            variant={"warning"}
            title={`Viewing the Admin as the ${assumed.name} ${assumed.type}.`}
            message={`Permissions are enforced as this ${assumed.type}, so anything you are not allowed to do will fail.`}
            action={action}
        />
    );
});
