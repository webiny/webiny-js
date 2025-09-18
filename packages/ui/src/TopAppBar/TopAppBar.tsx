import React from "react";
import { HeaderBar } from "@webiny/admin-ui";
import type { GenericRecord } from "@webiny/utils";

/*********************************************************************
 * TopAppBar
 *********************************************************************/
export interface RmwcTopAppBarProps {
    /** Emits when the navigation icon is clicked. */
    onNav?: (evt: any) => void;
    /** Styles the top app bar as a fixed top app bar. */
    fixed?: boolean;
    /** Styles the top app bar as a prominent top app bar. */
    prominent?: boolean;
    /** Styles the top app bar as a short top app bar. */
    short?: boolean;
    /** Styles the top app bar to always be collapsed. */
    shortCollapsed?: boolean;
    /** Styles the top app bar to be dense. */
    dense?: boolean;
    /** Set a scrollTarget other than the window when you are using the TopAppBar inside of a nested scrolling DOM Element. Please note that you should store your scrollTarget in a stateful variable. See example https://codesandbox.io/s/reverent-austin-16zzi.*/
    scrollTarget?: Element | null;
    /** Advanced: A reference to the MDCFoundation. */
    foundationRef?: any;
}

export type TopAppBarProps = RmwcTopAppBarProps & {
    /**
     * Element children
     */
    children: React.ReactNode[] | React.ReactNode;
    /**
     * CSS class name
     */
    className?: string;
    /**
     * Style object
     */
    style?: React.CSSProperties;
};

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `HeaderBar` component from the `@webiny/admin-ui` package instead.
 */
const TopAppBar = (props: TopAppBarProps) => {
    const { children, ...rest } = props;

    let start, middle, end;
    React.Children.forEach(children, child => {
        if (!React.isValidElement(child)) {
            return;
        }

        const { alignStart, alignEnd } = child.props as GenericRecord;
        if (alignStart) {
            start = child;
        } else if (alignEnd) {
            end = child;
        } else {
            middle = child;
        }
    });
    return <HeaderBar start={start} middle={middle} end={end} {...rest} />;
};

export { TopAppBar };
