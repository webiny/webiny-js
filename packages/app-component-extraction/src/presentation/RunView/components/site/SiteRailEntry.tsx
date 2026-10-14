import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Text, cn } from "@webiny/admin-ui";
import { StatusDot } from "~/presentation/shared/StatusIndicator.js";
import type { DisplayStatus } from "~/presentation/shared/status.js";
import type { RunViewPresenter } from "../../abstractions.js";

interface Props {
    presenter: RunViewPresenter.Interface;
    /** Opens the site; the run page also puts it in the URL. */
    onOpen: () => void;
}

/**
 * The rail row after the nine stages: where the migrated pages are.
 *
 * Not a stage. The site belongs to the job and has no ledger entry, so its state comes from the site
 * record: not built, building, built, or a build that failed.
 */
export const SiteRailEntry = createReactiveComponent(function SiteRailEntry({
    presenter,
    onOpen
}: Props) {
    const { vm } = presenter;
    const build = vm.site?.lastBuild;
    const status: DisplayStatus =
        vm.buildingSite || build?.status === "running"
            ? "running"
            : build?.status === "done"
              ? "complete"
              : build?.status === "failed"
                ? "failed"
                : "not-started";

    return (
        <button
            type="button"
            onClick={onOpen}
            className={cn(
                "mt-xxs flex items-center gap-sm rounded-sm border-l-2 border-t border-transparent border-t-neutral-dimmed py-xs pl-xs pr-sm pt-sm text-left transition-colors",
                "cursor-pointer hover:bg-neutral-light",
                vm.showSite && "border-l-primary bg-neutral-light"
            )}
        >
            <StatusDot status={status} stageNumber={10} />
            <Text
                size="sm"
                className={cn("flex-1 truncate", vm.showSite ? "font-semibold" : "font-regular")}
            >
                Site
            </Text>
        </button>
    );
});
