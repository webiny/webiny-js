import React from "react";
import { Heading } from "~/Heading/index.js";
import { Text } from "~/Text/index.js";
import type { CardProps } from "~/Card/index.js";

type CardHeaderProps = Pick<CardProps, "title" | "description" | "options">;

const CardHeader = ({ title, description, options }: CardHeaderProps) => {
    if (!title && !description && !options) {
        return null;
    }

    return (
        <div className={"flex flex-row justify-between"}>
            <div className={"flex flex-col gap-y-xs"}>
                {typeof title === "string" ? (
                    <Heading level={6} as={"h1"}>
                        {title}
                    </Heading>
                ) : (
                    title
                )}
                {typeof description === "string" ? (
                    <Text size="sm" className={"text-neutral-strong"}>
                        {description}
                    </Text>
                ) : (
                    description
                )}
            </div>
            <div>{options}</div>
        </div>
    );
};

export { CardHeader, type CardHeaderProps };
