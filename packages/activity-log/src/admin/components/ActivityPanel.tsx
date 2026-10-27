import React, { useState } from "react";
import { Heading, IconButton } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { useActivityTimeline } from "~/admin/hooks/useActivityTimeline.js";
import { ActivityFilterToggle } from "./ActivityFilterToggle.js";
import { ActivityTimelineView } from "./timeline/ActivityTimelineView.js";
import { TYPE } from "./typeScale.js";

interface ActivityPanelProps {
    entryId: string;
    modelId: string;
    revision: string;
    status: string | null;
    revisionStatuses: Record<string, string>;
    /** Fields this reader has no access to, withheld from the timeline the way the form withholds them. */
    hiddenFields: Set<string>;
    writeToken: string;
    onClose(): void;
}

/**
 * The panel's own chrome: what it is, how to refresh it, how to close it.
 *
 * An `aside` with its own surface and a hairline down its left edge, which is what the comments
 * drawer is — the border is the only thing separating the panel from the form, since both sit on
 * the same white, and without it the timeline reads as a column of the form rather than a thing
 * beside it. It runs the full height because the element is `h-full` inside a column the decorator
 * holds at the viewport's height: the form scrolls within its own column, so the edge stays put
 * rather than scrolling away with the fields.
 *
 * The refresh control is not decoration. A save refreshes the timeline by itself, but on a
 * DynamoDB-and-OpenSearch install the read model can lag beyond the automatic retry budget, and
 * refresh is then the difference between waiting and being stuck with a stale panel.
 */
export const ActivityPanel = ({
    entryId,
    modelId,
    revision,
    status,
    revisionStatuses,
    hiddenFields,
    writeToken,
    onClose
}: ActivityPanelProps) => {
    const timeline = useActivityTimeline({
        targetType: "cms-entry",
        targetId: entryId,
        modelId,
        writeToken,
        currentRevision: revision,
        currentStatus: status,
        revisionStatuses,
        hiddenFields
    });

    /**
     * Whether the filter bar is showing. Here rather than in the timeline because the button that
     * opens it lives in the panel's chrome and the bar it opens lives below — one piece of state
     * with two readers, so it belongs to the thing that contains both.
     */
    const [filtersOpen, setFiltersOpen] = useState(false);
    const filterCount = (timeline.filters.revision ? 1 : 0) + (timeline.filters.actorId ? 1 : 0);

    return (
        <aside
            className={
                "flex h-full min-h-0 flex-col border-l-sm border-neutral-dimmed bg-neutral-base"
            }
        >
            {/*
              `14px 16px 12px`, which is the comments header's padding rather than a tidier pair.
              It is what puts the two titles on the same baseline when both drawers are open, and
              two drawers whose headers are nine pixels out of line is the kind of thing a reader
              notices without being able to say why.
            */}
            <div
                className={
                    "flex flex-shrink-0 items-center gap-sm border-b-sm border-neutral-dimmed px-md pt-[14px] pb-[12px]"
                }
            >
                <Heading level={6} className={TYPE.title}>
                    Activity
                </Heading>
                {/*
                  Filter, refresh and close as one group, which is where the design puts the
                  controls: reached for rather than read, and out of the way of the timeline. What
                  stays below is only the applied state — the summary line and a chip per filter.
                */}
                {/*
                  `[&>span]:flex` because `Button` and `IconButton` each wrap themselves in an
                  `inline-block` span, and an inline box reserves a descender below its content —
                  one pixel, which the row then inherits and hands to the header. It is the last
                  pixel between this header and the comments one.
                */}
                <div className={"ml-auto flex items-center gap-xxs [&>span]:flex"}>
                    <ActivityFilterToggle
                        open={filtersOpen}
                        count={filterCount}
                        onToggle={() => setFiltersOpen(open => !open)}
                    />
                    <IconButton
                        variant={"ghost"}
                        size={"sm"}
                        aria-label={"Refresh activity"}
                        icon={<RefreshIcon />}
                        disabled={timeline.loading || timeline.refreshing}
                        onClick={timeline.reload}
                    />
                    <IconButton
                        variant={"ghost"}
                        size={"sm"}
                        aria-label={"Close activity"}
                        icon={<CloseIcon />}
                        onClick={onClose}
                    />
                </div>
            </div>

            <div className={"min-h-0 flex-1"}>
                <ActivityTimelineView {...timeline} filtersOpen={filtersOpen} />
            </div>
        </aside>
    );
};
