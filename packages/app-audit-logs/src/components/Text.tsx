import React from "react";
import { Text as BaseText, Heading } from "@webiny/admin-ui";
import type { HeadingLevels } from "@webiny/admin-ui";

type TypographyT =
    | "headline1"
    | "headline2"
    | "headline3"
    | "headline4"
    | "headline5"
    | "headline6"
    | "subtitle1"
    | "subtitle2"
    | "body1"
    | "body2"
    | "caption"
    | "button"
    | "overline";

export interface TypographyProps {
    use?: TypographyT;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

const headingLevelMap: Partial<Record<TypographyT, HeadingLevels>> = {
    headline1: 1,
    headline2: 2,
    headline3: 3,
    headline4: 4,
    headline5: 5,
    headline6: 6
};

const sizeMap: Partial<Record<TypographyT, "sm" | "md">> = {
    subtitle1: "md",
    subtitle2: "sm",
    body1: "md",
    body2: "sm",
    caption: "sm",
    button: "sm",
    overline: "sm"
};

export const Text = ({ use = "body2", children, className, style }: TypographyProps) => {
    const classes = `whitespace-nowrap overflow-hidden text-ellipsis ${className ?? ""}`.trim();

    if (use in headingLevelMap) {
        return (
            <Heading level={headingLevelMap[use]} className={classes} style={style}>
                {children}
            </Heading>
        );
    }
    return (
        <BaseText size={sizeMap[use] ?? "md"} className={classes} style={style}>
            {children}
        </BaseText>
    );
};
