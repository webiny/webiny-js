import React from "react";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import { Button, Popover } from "@webiny/admin-ui";
import { ReactComponent as WorkflowStateTooltipIcon } from "@webiny/icons/list.svg";
import { WorkflowStateTooltipContent } from "./Tooltip/WorkflowStateTooltipContent.js";
import { observer } from "mobx-react-lite";
import { useWorkflowState } from "~/Components/WorkflowStateSetup/useWorkflowState.js";

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
                    <Button variant={"secondary"} text={<WorkflowStateTooltipIcon />} />
                </span>
            }
            content={<WorkflowStateTooltipContent state={state} presenter={presenter} />}
            align="center"
            side="bottom"
            variant="subtle"
            arrow={true}
            close={false}
        />
    );
});

export const WorkflowStateTooltip = () => {
    const { presenter } = useWorkflowState();

    return <WorkflowStateTooltipObserver presenter={presenter} />;
};
