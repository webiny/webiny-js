import React from "react";
import { Avatar } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { ReviewerPickerOptionVm } from "../abstractions.js";

/*
 * One reviewer row: the initials avatar, the name with the muted teams line and, on the right, the
 * muted note. The note stays inside the option, so it is part of the row's accessible name.
 */
export const renderReviewerOption = (option: ReviewerPickerOptionVm): React.ReactNode => {
    return (
        <div className={"flex w-full items-center gap-sm"}>
            <Avatar size={"sm"} fallback={<Avatar.Fallback>{option.initials}</Avatar.Fallback>} />
            <div className={"flex min-w-0 flex-1 flex-col whitespace-normal"}>
                <Text size={"md"}>{option.label}</Text>
                {option.teams !== "" && (
                    <Text size={"sm"} className={"text-neutral-strong"}>
                        {option.teams}
                    </Text>
                )}
            </div>
            {option.note !== null && (
                <Text size={"sm"} className={"ml-auto shrink-0 text-neutral-strong"}>
                    {option.note}
                </Text>
            )}
        </div>
    );
};
