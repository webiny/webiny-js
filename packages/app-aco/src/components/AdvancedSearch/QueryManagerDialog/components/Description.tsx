import React from "react";
import { ListItemTextSecondary } from "@webiny/ui/List";

// @ts-ignore
import TimeAgo from "timeago-react";

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
