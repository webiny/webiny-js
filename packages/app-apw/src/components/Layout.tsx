import React from "react";
import styled from "@emotion/styled";
import isPropValid from "@emotion/is-prop-valid";

const spacing = {
    0: "0px",
    1: "4px",
    1.5: "6px",
    2: "8px",
    2.5: "10px",
    3: "12px",
    3.5: "14px",
    4: "16px",
    5: "20px",
    6: "24px",
    7: "28px",
    8: "32px",
    9: "36px",
    10: "40px"
};

export type SpacingScale = 0 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface StyledBoxProps {
    padding?: SpacingScale;
    paddingTop?: SpacingScale;
    paddingRight?: SpacingScale;
    paddingBottom?: SpacingScale;
    paddingLeft?: SpacingScale;
    paddingX?: SpacingScale;
    paddingY?: SpacingScale;
    margin?: SpacingScale;
    marginTop?: SpacingScale;
    marginRight?: SpacingScale;
    marginBottom?: SpacingScale;
    marginLeft?: SpacingScale;
    marginX?: SpacingScale;
    marginY?: SpacingScale;
    width?: string;
    display?: string;
    useNegativeMargin?: boolean;
    justifyContent?: string;
    alignItems?: string;
    boxSizing?:
        | "-moz-initial"
        | "inherit"
        | "initial"
        | "revert"
        | "unset"
        | "border-box"
        | "content-box";
}

const StyledBox = ({
    paddingX,
    paddingY,
    marginX,
    marginY,
    width,
    display,
    useNegativeMargin,
    justifyContent,
    alignItems,
    ...props
}: StyledBoxProps) => {
    const padding = props.padding ? spacing[props.padding] : undefined;
    let paddingTop = props.paddingTop ? spacing[props.paddingTop] : undefined;
    let paddingRight = props.paddingRight ? spacing[props.paddingRight] : undefined;
    let paddingBottom = props.paddingBottom ? spacing[props.paddingBottom] : undefined;
    let paddingLeft = props.paddingLeft ? spacing[props.paddingLeft] : undefined;
    if (paddingX) {
        paddingLeft = spacing[paddingX];
        paddingRight = spacing[paddingX];
    }
    if (paddingY) {
        paddingTop = spacing[paddingY];
        paddingBottom = spacing[paddingY];
    }

    let margin = props.margin ? spacing[props.margin] : undefined;
    let marginTop = props.marginTop ? spacing[props.marginTop] : undefined;
    let marginRight = props.marginRight ? spacing[props.marginRight] : undefined;
    let marginBottom = props.marginBottom ? spacing[props.marginBottom] : undefined;
    let marginLeft = props.marginLeft ? spacing[props.marginLeft] : undefined;

    if (marginX) {
        marginLeft = spacing[marginX];
        marginRight = spacing[marginX];
    }
    if (marginY) {
        marginTop = spacing[marginY];
        marginBottom = spacing[marginY];
    }

    if (useNegativeMargin) {
        margin = `-${margin}`;
        marginTop = `-${marginTop}`;
        marginRight = `-${marginRight}`;
        marginBottom = `-${marginBottom}`;
        marginLeft = `-${marginLeft}`;
    }

    /**
     * Always have a width defined.
     */
    const boxSizing = props.boxSizing || "border-box";

    return {
        boxSizing,
        width,
        display,
        justifyContent,
        alignItems,
        padding,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        margin,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft
    };
};

const IGNORED_PROPS = ["display", "width"];

export const Box = styled("div", {
    /**
     * We don't want to pass "display" and "width" properties to underlying "div" HTML tag.
     */
    shouldForwardProp: prop => isPropValid(prop) && !IGNORED_PROPS.includes(prop)
})(StyledBox);

interface ColumnsProps extends StyledBoxProps {
    space: SpacingScale;
    children: Array<React.ReactComponentElement<typeof Box>>;
    className?: string;
}

export const Columns: React.FC<ColumnsProps> = ({ children, space, ...props }) => {
    return (
        <Box display="flex" {...props}>
            {React.Children.map(children, (child, index) => {
                if (child === null) {
                    return child;
                }
                const childProps: any = {};
                if (index > 0) {
                    childProps["marginLeft"] = space;
                }

                return React.cloneElement(child, { ...childProps, ...child.props });
            })}
        </Box>
    );
};

interface StackProps extends StyledBoxProps {
    space: SpacingScale;
    children: Array<React.ReactComponentElement<typeof Box | typeof Columns> | null>;
    className?: string;
}

export const Stack = ({ children, space, ...props }: StackProps) => {
    return (
        <Box {...props}>
            {React.Children.map(children, (child, index) => {
                if (child === null) {
                    return child;
                }
                if (index > 0) {
                    return React.cloneElement(child, { marginTop: space });
                }

                return child;
            })}
        </Box>
    );
};
