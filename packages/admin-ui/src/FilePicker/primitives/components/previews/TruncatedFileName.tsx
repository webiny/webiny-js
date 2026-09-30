import React from "react";
import { Text } from "~/Text/index.js";
import { cn } from "~/utils.js";
import { splitFileName } from "./fileName.js";

interface TruncatedFileNameProps {
    name: string;
    className?: string;
}

/**
 * A file name that truncates in the middle, keeping the extension (and a little of the stem)
 * visible: "tide-cc-statuses-v2.png" becomes "tide-cc-statu…-v2.png".
 */
const TruncatedFileName = ({ name, className }: TruncatedFileNameProps) => {
    const { head, tail } = splitFileName(name);

    return (
        <Text size="sm" as="div" className={cn("flex min-w-0", className)} title={name}>
            <span className={"truncate"}>{head}</span>
            {tail ? <span className={"shrink-0 whitespace-pre"}>{tail}</span> : null}
        </Text>
    );
};

export { TruncatedFileName, type TruncatedFileNameProps };
