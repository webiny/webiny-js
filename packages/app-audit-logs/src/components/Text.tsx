import React from "react";
import styled from "@emotion/styled";
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

const Typography = ({ use = "body2", children, className, style }: TypographyProps) => {
    if (use in headingLevelMap) {
        return (
            <Heading level={headingLevelMap[use]} className={className} style={style}>
                {children}
            </Heading>
        );
    }
    return (
        <BaseText size={sizeMap[use] ?? "md"} className={className} style={style}>
            {children}
        </BaseText>
    );
};

export const Text = styled(Typography)`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;
