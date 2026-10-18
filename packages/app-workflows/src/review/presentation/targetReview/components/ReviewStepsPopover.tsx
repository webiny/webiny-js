import React from "react";
import { useState } from "react";
import { Popover } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { TargetReviewProgressVm } from "../abstractions.js";
import type { TargetReviewSegmentVm } from "../abstractions.js";
import { ReviewStepTag } from "./ReviewStepTag.js";

export interface ReviewStepsPopoverProps {
    progress: TargetReviewProgressVm;
    children: React.ReactNode;
}

// The text line of a segment: the run message of a running or failed step, else the quoted comment.
const getSegmentLine = (segment: TargetReviewSegmentVm): string | null => {
    if (segment.message !== null) {
        return segment.message;
    }
    if (segment.comment) {
        return `“${segment.comment}”`;
    }
    return null;
};

/*
 * The steps popover (README 6, R263): every step's state tag with its tooltip, owner and text
 * line. Opens on hover and on click or keyboard (the trigger is a button); `useState` holds one
 * visual flag only.
 */
export const ReviewStepsPopover = (props: ReviewStepsPopoverProps) => {
    const { progress, children } = props;
    const [open, setOpen] = useState(false);

    const content = (
        <ul className={"m-none flex min-w-[280px] list-none flex-col gap-sm-plus p-none"}>
            {progress.segments.map(segment => {
                const line = getSegmentLine(segment);
                return (
                    <li key={segment.stepId} className={"flex flex-col gap-xs"}>
                        <div className={"flex items-center gap-sm"}>
                            <Text size={"md"} className={"font-semibold"}>
                                {segment.title}
                            </Text>
                            <ReviewStepTag tag={segment.tag} tooltip={segment.tooltip} />
                        </div>
                        <Text size={"sm"} className={"text-neutral-strong"}>
                            {segment.ownerLabel}
                        </Text>
                        {line !== null ? <Text size={"sm"}>{line}</Text> : null}
                    </li>
                );
            })}
        </ul>
    );

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
            align={"start"}
            content={content}
            trigger={
                <button
                    type={"button"}
                    className={"flex cursor-pointer items-center gap-sm-plus bg-transparent p-none"}
                    onMouseEnter={() => setOpen(true)}
                >
                    {children}
                </button>
            }
        />
    );
};
