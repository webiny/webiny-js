import "./index.css";
import React from "react";
import {
    CollapsibleList as RmwcCollapsibleList,
    CollapsibleListProps as RmwcCollapsibleListProps
} from "@rmwc/list";

export type CollapsibleListProps = RmwcCollapsibleListProps & {
    children: React.ReactNode;
};

export const CollapsibleList: React.VFC<CollapsibleListProps> = props => {
    return <RmwcCollapsibleList {...props} />;
};

export default CollapsibleList;
