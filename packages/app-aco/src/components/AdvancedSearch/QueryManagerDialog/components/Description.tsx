import React from "react";
import { ListItemTextSecondary } from "@webiny/ui/List";
import { TimeAgo } from "@webiny/ui/TimeAgo";

export interface DescriptionProps {
    children?: string;
    createdOn: string;
}

export const Description = (props: DescriptionProps) => {
    return (
        <ListItemTextSecondary>
            {"Created"} <TimeAgo datetime={props.createdOn} />
            {props.children && ` - ${props.children}`}
        </ListItemTextSecondary>
    );
};
