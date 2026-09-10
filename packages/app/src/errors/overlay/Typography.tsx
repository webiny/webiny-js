import React from "react";

export declare type TypographyT = "headline" | "body" | "subtitle";

export interface TypographyProps {
    use: TypographyT;
    children?: React.ReactNode;
    className?: string;
}

export const Typography = (props: TypographyProps) => {
    const { children, use, className } = props;

    if (use === "headline") {
        return <h4 className={className}>{children}</h4>;
    }

    return <p className={className}>{children}</p>;
};
