import React from "react";
import type { IWorkflowStatesWidgetItem } from "~/types.js";
import { Accordion, Icon, List, Popover } from "@webiny/admin-ui";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";
import { ReactComponent as DeclineIcon } from "@webiny/icons/do_not_disturb.svg";

interface IWorkflowStateRowOptionsProps {
    state: IWorkflowStatesWidgetItem;
}

export const WorkflowStateRowOptions = ({ state }: IWorkflowStateRowOptionsProps) => {
    return (
        <Popover
            trigger={
                <Accordion.Item.Action
                    icon={<Icon icon={<MoreVerticalIcon />} label={"Options"} />}
                />
            }
            content={
                <List>
                    <List.Item
                        icon={<Icon icon={<OpenInNewIcon />} label={"Open In New Window"} />}
                        title={"Open in New Window"}
                        onClick={() => {
                            console.log({
                                opening: state.id
                            });
                        }}
                    />
                    <List.Item
                        icon={<Icon icon={<ApproveIcon />} label={"Approve"} />}
                        title={"Approve"}
                        onClick={() => {
                            console.log({
                                approving: state.id
                            });
                        }}
                    />
                    <List.Item
                        icon={<Icon icon={<DeclineIcon />} label={"Decline"} />}
                        title={"Decline"}
                        onClick={() => {
                            console.log({
                                declining: state.id
                            });
                        }}
                    />
                </List>
            }
            align="start"
            side="bottom"
            variant="subtle"
            arrow={false}
            close={false}
        />
    );
};
