import React from "react";
import { Text } from "~/Text/index.js";

interface ProgressBarProps {
    value: string;
}

const ProgressValue = ({ value }: ProgressBarProps) => {
    return (
        <Text size={"sm"} className={"leading-none shrink-0"}>
            {value}
        </Text>
    );
};

export { ProgressValue, type ProgressBarProps };
