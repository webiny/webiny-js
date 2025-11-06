import { DropdownMenu, Icon } from "@webiny/admin-ui";
import React from "react";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";

interface IWorkflowStateOptionsOpenInNewWindowProps {
    onClick: () => void;
}

export const WorkflowStateOptionsOpenInNewWindow = (
    props: IWorkflowStateOptionsOpenInNewWindowProps
) => {
    const { onClick } = props;
    return (
        <DropdownMenu.Item
            icon={<Icon icon={<OpenInNewIcon />} label={"Open In New Window"} />}
            text={"Open in New Window"}
            onClick={onClick}
        />
    );
};
