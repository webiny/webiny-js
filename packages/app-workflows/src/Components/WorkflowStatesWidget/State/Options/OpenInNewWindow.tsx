import { DropdownMenu, Icon } from "@webiny/admin-ui";
import React from "react";
import type { IWorkflowState } from "~/types.js";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";

interface IWorkflowStateRowOptionsOpenInNewWindowProps {
    state: IWorkflowState;
}

export const WorkflowStateRowOptionsOpenInNewWindow = ({
    state
}: IWorkflowStateRowOptionsOpenInNewWindowProps) => {
    return (
        <DropdownMenu.Item
            icon={<Icon icon={<OpenInNewIcon />} label={"Open In New Window"} />}
            text={"Open in New Window"}
            onClick={() => {
                console.log({
                    opening: state.id
                });
            }}
        />
    );
};
