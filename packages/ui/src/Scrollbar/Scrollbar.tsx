import * as React from "react";
import { Scrollbars } from "react-custom-scrollbars";

type Props = {
    // Element on which the scrollbars will be applied.
    children?: React.ReactNode;

    style?: React.CSSProperties;

    [key: string]: any;
};

/**
 * Use Scrollbar component to show vertical or horizontal scrollbars.
 */
const Scrollbar = (props: Props) => {
    return <Scrollbars {...props} />;
};

export { Scrollbar };
