import React from "react";
import { Text } from "@webiny/admin-ui";

interface SectionHeaderProps {
    title: string;
    action?: React.ReactNode;
}

const SectionHeader = ({ title, action }: SectionHeaderProps) => (
    <div className={"flex items-center justify-between px-md py-sm-extra"}>
        <Text as="div" size={"sm"} className={"font-semibold text-neutral-primary"}>
            {title}
        </Text>
        {action}
    </div>
);

export { SectionHeader, type SectionHeaderProps };
