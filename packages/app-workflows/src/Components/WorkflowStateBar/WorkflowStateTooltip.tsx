import React from "react";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import { Button, Popover } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { WorkflowStateTooltipContent } from "./Tooltip/WorkflowStateTooltipContent.js";
import { observer } from "mobx-react-lite";

export interface IWorkflowStateTooltipButtonProps {
    presenter: IWorkflowStatePresenter;
}

const WorkflowStateTooltipObserver = observer((props: IWorkflowStateTooltipButtonProps) => {
    const { presenter } = props;
    const { state } = presenter.vm;
    if (!state) {
        return null;
    }
    return (
        <Popover
            trigger={
                <span>
                    <Button variant={"secondary"} text={<AddIcon />} />
                </span>
            }
            content={<WorkflowStateTooltipContent state={state} />}
            align="center"
            side="bottom"
            variant="subtle"
            arrow={true}
            close={false}
        />
    );
});

export const WorkflowStateTooltip = (props: IWorkflowStateTooltipButtonProps) => {
    const { presenter } = props;

    return <WorkflowStateTooltipObserver presenter={presenter} />;
};
