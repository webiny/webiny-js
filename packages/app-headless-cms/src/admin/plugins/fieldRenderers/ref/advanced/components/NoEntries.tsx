import React from "react";
import { Text } from "@webiny/admin-ui";

interface NoEntriesProps {
    text?: React.ReactNode;
}

const NoEntries = ({ text = "No records found." }: NoEntriesProps) => {
    return (
        <div
            className={
                "flex justify-center px-xl py-md-extra bg-neutral-subtle"
            }
        >
            <Text size={"sm"}>{text}</Text>
        </div>
    );
};

export { NoEntries, type NoEntriesProps };
