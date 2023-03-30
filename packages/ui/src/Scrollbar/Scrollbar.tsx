import React from "react";
import { ScrollbarProps, Scrollbars } from "react-custom-scrollbars";

interface Props extends ScrollbarProps {
    style?: React.CSSProperties;
    [key: string]: any;
}

/**
 * Use Scrollbar component to show vertical or horizontal scrollbars.
 */
const Scrollbar: React.VFC<Props> = props => {
    return <Scrollbars {...props} />;
};

export { Scrollbar };
