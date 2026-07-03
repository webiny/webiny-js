import React from "react";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";
import { Button, Icon as IconWrap, Popover } from "@webiny/admin-ui";
import { ReactComponent as WorkflowStateTooltipIcon } from "@webiny/icons/list.svg";
import { WorkflowStateTooltipContent } from "./WorkflowStateTooltipContent.js";
import { observer } from "mobx-react-lite";
import { useWorkflowState } from "../../useWorkflowState.js";

export interface IWorkflowStateTooltipButtonProps {
    presenter: IWorkflowStatePresenter;
    Icon?: React.ComponentType;
}

const WorkflowStateTooltipObserver = observer((props: IWorkflowStateTooltipButtonProps) => {
    const { presenter, Icon } = props;
    const { state } = presenter.vm;
    if (!state) {
        return null;
    }
    return (
        <Popover
            trigger={
                <span>
                    <Button
                        variant={"secondary"}
                        text={
                            <IconWrap
                                label={"Tooltip"}
                                size={"sm"}
                                icon={Icon ? <Icon /> : <WorkflowStateTooltipIcon />}
                            />
                        }
                    />
                </span>
            }
            content={<WorkflowStateTooltipContent state={state} presenter={presenter} />}
            align="center"
            side="bottom"
            arrow={true}
            close={false}
        />
    );
});

export interface IWorkflowStateTooltipProps {
    Icon?: React.ComponentType;
}

export const WorkflowStateTooltip = (props: IWorkflowStateTooltipProps) => {
    const { presenter } = useWorkflowState();

    return <WorkflowStateTooltipObserver presenter={presenter} Icon={props.Icon} />;
};
