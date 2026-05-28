import React from "react";
import { Text } from "@webiny/admin-ui";
import { LayoutIllustration } from "~/BaseEditor/defaultConfig/Toolbar/Navigator/LayoutIllustration.js";

export const SidebarEmptyState = ({ message }: { message: string }) => {
    return (
        <div className={"flex flex-col items-center gap-md px-md text-center mt-[200px]"}>
            <LayoutIllustration />
            <Text size={"sm"} className={"text-neutral-strong"}>
                {message}
            </Text>
        </div>
    );
};
