import React from "react";
import { Avatar } from "@webiny/admin-ui";
import { FormComponentDescription } from "@webiny/admin-ui";
import { FormComponentNote } from "@webiny/admin-ui";
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
                    <FormComponentDescription
                        className={"mb-0"}
                        text={<Text size={"sm"}>{option.teams}</Text>}
                    />
                )}
            </div>
            {option.note !== null && (
                <FormComponentNote
                    className={"ml-auto mt-0 shrink-0"}
                    text={<Text size={"sm"}>{option.note}</Text>}
                />
            )}
        </div>
    );
};
