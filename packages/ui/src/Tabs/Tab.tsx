import React from "react";
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
    /**
     * Tab ID for the testing.
     */
    "data-testid"?: string;
};

export const Tab: React.FC<TabProps> = props => {
    const { children, ...rest } = props;
    return <RmwcTab {...rest}>{children}</RmwcTab>;
};
