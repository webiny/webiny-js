import React from "react";
import { TypographyProps as RmwcTypographyProps } from "@rmwc/typography";

import { Heading, HeadingLevels, Text } from "@webiny/ui-new";

interface TypographyProps extends RmwcTypographyProps {
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    tag?: string;
}

/**
 * Use Ripple component to display a list of choices, once the handler is triggered.
 */
const Typography = (props: TypographyProps) => {
    const { children, use, className, style } = props;

    // Define a mapping of use values to heading levels
    const headingLevelMap: { [key: string]: HeadingLevels } = {
        headline1: 1,
        headline2: 2,
        headline3: 3,
        headline4: 4,
        headline5: 5,
        headline6: 6
    };

    if (use in headingLevelMap) {
        const level = headingLevelMap[use];
        return <Heading level={level} text={children} className={className} style={style} />;
    }

    return <Text size={"md"} text={children} className={className} style={style} />;
};

export { Typography, TypographyProps };
