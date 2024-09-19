import React from "react";
import { ScrollbarProps, Scrollbars } from "react-custom-scrollbars";

interface Props extends ScrollbarProps {
    style?: React.CSSProperties;
    [key: string]: any;
}

/**
 * Use Scrollbar component to show vertical or horizontal scrollbars.
 */
const Scrollbar = (props: Props) => {
    return <Scrollbars {...props} />;
};

export { Scrollbar };
