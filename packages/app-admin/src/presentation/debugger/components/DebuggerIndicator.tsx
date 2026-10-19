import React from "react";
import { useFeature } from "@webiny/app";
import { useRouter } from "@webiny/app";
import { DropdownMenu } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { ReactComponent as DebuggerIcon } from "@webiny/icons/bug_report.svg";
import { DebuggerIndicator as BaseDebuggerIndicator } from "~/base/ui/DebuggerIndicator.js";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";
import { DebuggerPresenterFeature } from "../feature.js";
import { DebuggerRoutes } from "../routes.js";

/**
 * Says that capture is on, how much has been collected, and offers what is worth doing about it.
 *
 * Renders nothing while capture is off, which is the normal state. When it is on it is deliberately
 * hard to miss, because leaving capture running is the mistake it exists to prevent.
 *
 * Clearing matters as much as downloading: an hour of browsing collects a great deal, and everything
 * held is in memory and lands in the next report whether or not it is relevant to the problem being
 * reproduced.
 */
const DebuggerIndicatorView = createReactiveComponent(() => {
    const { presenter } = useFeature(DebuggerPresenterFeature);
    const router = useRouter();
    const { vm } = presenter;

    if (!vm.captureOn) {
        return null;
    }

    const hasEntries = vm.entryCount > 0;
    const content = hasEntries ? `Debug mode (${vm.entryCount})` : "Debug mode";
    const title = hasEntries
        ? `Debug capture is on. ${vm.entryCount} entries collected.`
        : "Debug capture is on. Nothing collected yet.";

    return (
        <DropdownMenu
            trigger={
                <div className={"cursor-pointer"} title={title} data-testid={"debugger-indicator"}>
                    <Tag variant={"accent-light"} icon={<DebuggerIcon />} content={content} />
                </div>
            }
        >
            <DropdownMenu.Item
                text={"Download report"}
                disabled={!hasEntries}
                onClick={presenter.downloadReport}
            />
            <DropdownMenu.Item
                text={"Clear collected data"}
                disabled={!hasEntries}
                onClick={presenter.clear}
            />
            <DropdownMenu.Separator />
            <DropdownMenu.Item
                text={"Open debugger"}
                onClick={() => router.goToRoute(DebuggerRoutes.Debugger)}
            />
        </DropdownMenu>
    );
});

export const DebuggerIndicator = BaseDebuggerIndicator.createDecorator(() => {
    return function DebuggerIndicator() {
        return <DebuggerIndicatorView />;
    };
});
