import React from "react";
import { useState } from "react";
import { Button } from "@webiny/admin-ui";
import { List } from "@webiny/admin-ui";
import { Popover } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { TargetReviewProgressVm } from "../abstractions.js";
import { ReviewStepTag } from "./ReviewStepTag.js";

export interface ReviewStepsPopoverProps {
    progress: TargetReviewProgressVm;
}

/*
 * The steps popover (README 6, R263): every step's state tag with its tooltip, owner and text
 * line. Opens on click or keyboard only (the trigger is a button), never on hover: the popover
 * takes the focus when it opens, so a hover would pull it out of the editor. `useState` holds one
 * visual flag only. The button sits in a ref-able span: admin-ui `Button` does not forward refs,
 * so a bare button trigger would leave the popper without an anchor (as admin-ui Tooltip does).
 */
export const ReviewStepsPopover = (props: ReviewStepsPopoverProps) => {
    const { progress } = props;
    const [open, setOpen] = useState(false);

    const content = (
        <div data-role={"review-steps-content"} className={"max-w-2xl"}>
            <List background={"transparent"}>
                {progress.segments.map(segment => {
                    let note: React.ReactElement | null = null;
                    if (segment.message !== null) {
                        note = (
                            <Text as={"div"} size={"sm"} className={"break-words"}>
                                {segment.message}
                            </Text>
                        );
                    } else if (segment.comment) {
                        note = (
                            <Text as={"div"} size={"sm"} className={"break-words"}>
                                {`“${segment.comment}”`}
                            </Text>
                        );
                    }

                    return (
                        <List.Item
                            key={segment.stepId}
                            colorMark={segment.color ?? undefined}
                            title={segment.title}
                            actions={<ReviewStepTag tag={segment.tag} tooltip={segment.tooltip} />}
                            description={
                                <>
                                    {segment.description ? (
                                        <Text as={"div"} size={"sm"}>
                                            {segment.description}
                                        </Text>
                                    ) : null}
                                    <Text as={"div"} size={"sm"}>
                                        {segment.ownerLabel}
                                    </Text>
                                    {note}
                                </>
                            }
                        />
                    );
                })}
            </List>
        </div>
    );

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
            align={"start"}
            content={content}
            trigger={
                <span data-role={"review-steps-trigger"} className={"inline-flex"}>
                    <Button
                        type={"button"}
                        variant={"ghost"}
                        size={"sm"}
                        text={`${progress.approved} of ${progress.total} steps approved`}
                    />
                </span>
            }
        />
    );
};
