import React from "react";
import { useActivityTimeline } from "~/admin/hooks/useActivityTimeline.js";
import { ActivityTimelineView } from "./timeline/ActivityTimelineView.js";

/**
 * The timeline, arranged.
 *
 * Every decision about *what* a row says lives in `src/timeline/` as a pure function:
 * `describeAction` builds the sentence, `describeActor` decides whether a person was present,
 * `describeChange` splits a path into a field and its containers, `describeGroup` writes the
 * revision header. This file only arranges what they return, and reaches for a design-system
 * component wherever one exists — `Accordion.Item` is the expandable save, `Avatar` the actor,
 * `Tag` every badge, `Alert` every notice, `EmptyState` both empty states, `TimeAgo` the relative
 * time.
 *
 * Two things are hand-rolled, both deliberately: the timeline rail (a left border with a dot per
 * row) and the sticky revision header. Neither has an equivalent in the design system, and
 * together they are what makes the revision-to-saves relationship readable — which is the hardest
 * requirement in the design, since one revision routinely holds many saves by several people.
 */

export interface ActivityTimelineProps {
    targetType: string;
    targetId: string;
    modelId: string;
    /** Changes when the target is written, which refreshes the timeline in place. */
    writeToken?: string;
    /** The revision the form is showing, so its group can be marked current. */
    currentRevision?: string;
    /** The current revision's publishing status, which only the form knows. */
    currentStatus?: string | null;
}

/**
 * The connected component: resolves the timeline for a target and hands it to the view.
 *
 * Deliberately holds no rendering of its own.
 */
export const ActivityTimeline = ({
    targetType,
    targetId,
    modelId,
    writeToken,
    currentRevision,
    currentStatus
}: ActivityTimelineProps) => {
    const timeline = useActivityTimeline({
        targetType,
        targetId,
        modelId,
        writeToken,
        currentRevision,
        currentStatus
    });

    return <ActivityTimelineView {...timeline} />;
};
