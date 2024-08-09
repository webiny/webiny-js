import React from "react";
import { cn } from "~/utils";

interface TypographyProps {
    text: string;
    className?: string;
}

export function TypographyH1(props: TypographyProps) {
    return (
        <h1
            className={cn(
                "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
                props.className
            )}
        >
            {props.text}
        </h1>
    );
}

export function TypographyH2(props: TypographyProps) {
    return (
        <h2
            className={cn(
                "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
                props.className
            )}
        >
            {props.text}
        </h2>
    );
}

export function TypographyH3(props: TypographyProps) {
    return (
        <h3 className={cn("scroll-m-20 text-2xl font-semibold tracking-tight", props.className)}>
            {props.text}
        </h3>
    );
}

export function TypographyH4(props: TypographyProps) {
    return (
        <h4 className={cn("scroll-m-20 text-xl font-semibold tracking-tight", props.className)}>
            {props.text}
        </h4>
    );
}

export function TypographyH5(props: TypographyProps) {
    return (
        <h4 className={cn("scroll-m-20 text-lg font-semibold tracking-tight", props.className)}>
            {props.text}
        </h4>
    );
}

export function TypographyH6(props: TypographyProps) {
    return (
        <h4 className={cn("scroll-m-20 text-md font-semibold tracking-tight", props.className)}>
            {props.text}
        </h4>
    );
}
