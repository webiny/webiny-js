import React from "react";
import { Button } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { IReportBugOutcomeVm } from "./abstractions.js";

interface IOutcomeDialogProps {
    outcome: IReportBugOutcomeVm;
    open: boolean;
    onClose: () => void;
}

/*
 * Shown only when the API filed the issue itself. Compose mode has no dialog: GitHub opens with
 * the report already in it, and a confirmation would only stand between the reporter and that.
 */
export const OutcomeDialog = ({ outcome, open, onClose }: IOutcomeDialogProps) => {
    return (
        <Dialog
            open={open}
            onOpenChange={onClose}
            title={"Issue filed"}
            actions={<Button variant={"primary"} text={"Done"} onClick={onClose} />}
        >
            <div className={"flex flex-col gap-sm"}>
                <Text>{"Thanks. The report is on GitHub with everything attached."}</Text>
                <a
                    href={outcome.url}
                    target={"_blank"}
                    rel={"noreferrer"}
                    className={"text-accent-primary underline"}
                >
                    {outcome.url}
                </a>
            </div>
        </Dialog>
    );
};
