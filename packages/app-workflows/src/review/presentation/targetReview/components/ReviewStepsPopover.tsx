import React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@webiny/admin-ui";
import { List } from "@webiny/admin-ui";
import { Popover } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { TargetReviewProgressVm } from "../abstractions.js";
import { ReviewStepTag } from "./ReviewStepTag.js";

export interface ReviewStepsPopoverProps {
    progress: TargetReviewProgressVm;
    // The progress bar: it shares the trigger wrapper so the popover anchors at the row's left edge.
    bar?: React.ReactNode;
}

/*
 * The steps popover (README 6, R263): every step's state tag with its tooltip, owner and comment or
 * message (no step description). Opens on click or keyboard only (the trigger is a button), never on hover: the popover
 * takes the focus when it opens, so a hover would pull it out of the editor. `useState` holds one
 * visual flag only. The button sits in a ref-able span: admin-ui `Button` does not forward refs,
 * so a bare button trigger would leave the popper without an anchor (as admin-ui Tooltip does).
 */
export const ReviewStepsPopover = (props: ReviewStepsPopoverProps) => {
    const { progress, bar } = props;
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const pointerTarget = useRef<EventTarget | null>(null);

    // Radix closes on pointer-down outside, before the click lands, so remember where that
    // pointer went: a click on another control keeps the focus there.
    useEffect(() => {
        if (!open) {
            return;
        }
        const onPointerDown = (event: PointerEvent) => {
            pointerTarget.current = event.target;
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown, true);
            pointerTarget.current = null;
        };
    }, [open]);

    // Radix returns focus to the trigger, which is the non-focusable wrapper, after the content's
    // exit animation unmounts it, so focus would land on the body. On a close without a pointer
    // outside (Escape), hand it to the inner button while the content is still mounted.
    const onOpenChange = (next: boolean) => {
        setOpen(next);
        if (next) {
            return;
        }
        const target = pointerTarget.current;
        const wrapper = wrapperRef.current;
        if (target instanceof Node && wrapper && !wrapper.contains(target)) {
            return;
        }
        wrapper?.querySelector("button")?.focus();
    };

    const content = (
        <div data-role={"review-steps-content"} className={"max-w-2xl max-h-96 overflow-y-auto"}>
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
            onOpenChange={onOpenChange}
            align={"start"}
            content={content}
            trigger={
                <span
                    ref={wrapperRef}
                    data-role={"review-steps-trigger"}
                    className={"flex w-full items-center gap-sm-plus"}
                >
                    {bar}
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
