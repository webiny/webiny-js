import * as React from "react";
import { Tab as RmwcTab, TabProps as RmwcTabProps } from "@rmwc/tabs";

export type TabProps = RmwcTabProps & {
    tag?: string;
    /**
     * Is tab disabled?
     */
    disabled?: boolean;
    /**
     * Style object
     */
    style?: React.CSSProperties;
};

export const Tab = (props: TabProps) => {
    const { children, ...rest } = props;
    return <RmwcTab {...rest}>{children}</RmwcTab>;
};
