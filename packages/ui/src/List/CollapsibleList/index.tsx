import "./index.css";
import * as React from "react";
import {
    CollapsibleList as RmwcCollapsibleList,
    CollapsibleListProps as RmwcCollapsibleListProps
} from "@rmwc/list";

export type CollapsibleListProps = RmwcCollapsibleListProps & {
    children: React.ReactNode; // import { CollapsibleList } from "@rmwc/list";
};

export const CollapsibleList = (props: CollapsibleListProps) => {
    return <RmwcCollapsibleList {...props} />;
};

export default CollapsibleList;
