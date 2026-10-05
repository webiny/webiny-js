import React from "react";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";
import { useFeature } from "@webiny/app";
import { Button } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { AssumedPermissionsBanner as BaseAssumedPermissionsBanner } from "~/base/ui/AssumedPermissionsBanner.js";
import { AssumePermissionsPresenterFeature } from "../feature.js";

/**
 * Stays on screen for as long as a preview is active, and is deliberately not dismissible: writes
 * fail while previewing, and someone who has lost the banner has no way to explain why.
 *
 * Rendered outside every permission gate, because the previewed role usually cannot see the menu
 * the preview was started from. Leaving it behind a gate would strand the user.
 */
const AssumedPermissionsBannerView = createReactiveComponent(() => {
    const { presenter } = useFeature(AssumePermissionsPresenterFeature);
    const vm = presenter.vm;

    if (!vm.assumed) {
        return null;
    }

    const kind = vm.assumed.type === "team" ? "team" : "role";

    /*
     * A slim bar across the content column, text centred and the action at the far right. Three
     * grid columns rather than an absolutely placed button, so a long role name wraps instead of
     * running under it.
     */
    return (
        <div
            className={"grid grid-cols-[1fr_auto_1fr] items-center gap-sm bg-warning px-sm py-xxs"}
            data-testid={"assumed-permissions-banner"}
        >
            <span />
            <Text size={"sm"} className={"text-center text-neutral-primary"}>
                {"Viewing the Admin as the "}
                <strong>{vm.assumed.name}</strong>
                {` ${kind}. Permissions are enforced as this ${kind}, so anything you are not allowed to do will fail.`}
            </Text>
            <div className={"justify-self-end"}>
                <Button
                    variant={"ghost"}
                    size={"sm"}
                    text={"Exit preview"}
                    disabled={vm.switching}
                    onClick={() => presenter.exit()}
                />
            </div>
        </div>
    );
});

export const AssumedPermissionsBanner = BaseAssumedPermissionsBanner.createDecorator(() => {
    return function AssumedPermissionsBanner() {
        return <AssumedPermissionsBannerView />;
    };
});
