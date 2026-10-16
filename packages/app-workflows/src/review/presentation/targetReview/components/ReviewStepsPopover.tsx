import React from "react";
import { useState } from "react";
import { Popover } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { TargetReviewProgressVm } from "../abstractions.js";
import { getStepStateTag } from "../getStepStateTag.js";

export interface ReviewStepsPopoverProps {
    progress: TargetReviewProgressVm;
    children: React.ReactNode;
}

/*
 * The steps popover (README 6): every step's state, owner and the full comment. Opens on hover
 * and on click or keyboard (the trigger is a button); `useState` holds one visual flag only.
 */
export const ReviewStepsPopover = (props: ReviewStepsPopoverProps) => {
    const { progress, children } = props;
    const [open, setOpen] = useState(false);

    const content = (
        <ul className={"m-none flex min-w-[280px] list-none flex-col gap-sm-plus p-none"}>
            {progress.segments.map(segment => {
                const tag = getStepStateTag(segment.state);
                return (
                    <li key={segment.stepId} className={"flex flex-col gap-xs"}>
                        <div className={"flex items-center gap-sm"}>
                            <Text size={"md"} className={"font-semibold"}>
                                {segment.title}
                            </Text>
                            <Tag variant={tag.variant} content={tag.label} />
                        </div>
                        <Text size={"sm"} className={"text-neutral-strong"}>
                            {segment.ownerLabel}
                        </Text>
                        {segment.comment ? <Text size={"sm"}>{`“${segment.comment}”`}</Text> : null}
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
