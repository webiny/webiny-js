import React from "react";
import { TypographyProps as RmwcTypographyProps } from "@rmwc/typography";

import { Heading, HeadingLevels, Text } from "@webiny/admin-ui";

interface TypographyProps extends RmwcTypographyProps {
    children?: React.ReactNode;
    className?: string;
    /**
     * @deprecated
     */
    style?: React.CSSProperties;
    tag?: string;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `<Heading />` or `<Text />` components from the `@webiny/admin-ui` package instead.
 */
const Typography = (props: TypographyProps) => {
    const { children, use, className } = props;

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
        return <Heading level={level} text={children} className={className} />;
    }

    return <Text size={"md"} text={children} className={className} />;
};

export { Typography, TypographyProps };
