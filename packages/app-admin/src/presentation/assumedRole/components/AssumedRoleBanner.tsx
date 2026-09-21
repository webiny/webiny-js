import React from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { Alert } from "@webiny/admin-ui";
import { AssumedRoleBanner as BaseAssumedRoleBanner } from "~/base/ui/AssumedRoleBanner.js";
import { AssumedRolePresenterFeature } from "../feature.js";

/**
 * Stays on screen for as long as a preview is active, and is deliberately not dismissible: writes
 * fail while previewing, and someone who has lost the banner has no way to explain why.
 *
 * Rendered outside every permission gate, because the previewed role usually cannot see the menu
 * the preview was started from — leaving it behind a gate would strand the user.
 */
const AssumedRoleBannerView = observer(() => {
    const { presenter } = useFeature(AssumedRolePresenterFeature);
    const vm = presenter.vm;

    if (!vm.assumedRole) {
        return null;
    }

    const kind = vm.assumedRole.type === "team" ? "team" : "role";

    /*
     * The name goes in the body rather than in Alert's `title`: that prop is not rendered, it
     * falls through to the root div and ends up as an HTML tooltip. Children run through
     * compileMarkdown, so the emphasis below survives.
     */
    return (
        <Alert
            type={"warning"}
            actions={
                <Alert.Action
                    text={"Exit preview"}
                    disabled={vm.switching}
                    onClick={() => presenter.exit()}
                />
            }
        >
            {`Viewing the Admin as the **${vm.assumedRole.name}** ${kind}. Permissions are enforced as this ${kind}, so anything you are not allowed to do will fail.`}
        </Alert>
    );
});

export const AssumedRoleBanner = BaseAssumedRoleBanner.createDecorator(() => {
    return function AssumedRoleBanner() {
        return <AssumedRoleBannerView />;
    };
});
