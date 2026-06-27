import React from "react";
import { Label, Text } from "@webiny/admin-ui";

interface ObjectFieldHeaderProps {
    label?: React.ReactNode;
    description?: React.ReactNode;
}

/**
 * The bold field label with its description stacked below it, shown above a list of object rows.
 */
export const ObjectFieldHeader = ({ label, description }: ObjectFieldHeaderProps) => {
    if (!label) {
        return null;
    }

    return (
        <div className={"flex flex-col"}>
            <Label text={label} className={"pb-xs"} />
            {description ? (
                <Text size={"sm"} className={"font-normal text-neutral-strong"}>
                    {description}
                </Text>
            ) : null}
        </div>
    );
};
