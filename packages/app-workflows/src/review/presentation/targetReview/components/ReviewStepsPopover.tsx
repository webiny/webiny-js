import React from "react";
import { useState } from "react";
import { Popover } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { TargetReviewProgressVm } from "../abstractions.js";
import { ReviewStepTag } from "./ReviewStepTag.js";

export interface ReviewStepsPopoverProps {
    progress: TargetReviewProgressVm;
    children: React.ReactNode;
}

/*
 * The steps popover (README 6, R263): every step's state tag with its tooltip, owner and text
 * line. Opens on click or keyboard only (the trigger is a button), never on hover: the popover
 * takes the focus when it opens, so a hover would pull it out of the editor. `useState` holds one
 * visual flag only.
 */
export const ReviewStepsPopover = (props: ReviewStepsPopoverProps) => {
    const { progress, children } = props;
    const [open, setOpen] = useState(false);

    const content = (
        <ul className={"m-none flex w-[380px] list-none flex-col gap-sm-plus p-none"}>
            {progress.segments.map(segment => {
                return (
                    <li key={segment.stepId} className={"flex flex-col gap-xs"}>
                        <div className={"flex items-center gap-sm"}>
                            {segment.color ? (
                                <span
                                    data-testid={"step-dot"}
                                    className={"size-2 shrink-0 rounded-full"}
                                    style={{ backgroundColor: segment.color }}
                                />
                            ) : null}
                            <Text size={"md"} className={"font-semibold"}>
                                {segment.title}
                            </Text>
                            {segment.description ? (
                                <Text size={"sm"} className={"text-neutral-strong"}>
                                    {segment.description}
                                </Text>
                            ) : null}
                            <span className={"ml-auto"}>
                                <ReviewStepTag tag={segment.tag} tooltip={segment.tooltip} />
                            </span>
                        </div>
                        <Text size={"sm"} className={"text-neutral-strong"}>
                            {segment.ownerLabel}
                        </Text>
                        {segment.message !== null ? (
                            <Text size={"sm"} className={"break-words"}>
                                {segment.message}
                            </Text>
                        ) : segment.comment ? (
                            <Text
                                size={"sm"}
                                className={"break-words bg-neutral-light rounded-sm px-sm py-xs"}
                            >
                                {`“${segment.comment}”`}
                            </Text>
                        ) : null}
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
                >
                    {children}
                </button>
            }
        />
    );
};
