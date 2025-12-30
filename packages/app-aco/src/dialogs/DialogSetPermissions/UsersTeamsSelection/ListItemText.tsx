import React from "react";
import { Text } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-admin";
import type { FolderLevelPermissionsTarget } from "~/types.js";

interface ListItemTextProps {
    target: FolderLevelPermissionsTarget;
}

export const ListItemText = ({ target }: ListItemTextProps) => {
    const { identity } = useSecurity();

    if (target.type === "admin") {
        return (
            <div>
                <Text as="div">
                    {target.name}&nbsp;
                    {target.id === identity!.id && <em>(you)</em>}
                </Text>
                <Text as={"div"} size={"sm"} className={"text-neutral-strong font-normal"}>
                    {target.meta.email || "E-mail not available."}
                </Text>
            </div>
        );
    }

    return <>{target.name}</>;
};
