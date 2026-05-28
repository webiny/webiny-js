import type { ReactElement } from "react";
import React from "react";
import { Text, Icon } from "@webiny/admin-ui";

export interface InfoMessageProps {
    message: string;
    icon?: ReactElement;
}

export const InfoMessage = ({ message, icon }: InfoMessageProps) => {
    return (
        <div className={"bg-neutral-dark/2 rounded-lg p-md flex flex-col items-center w-full"}>
            {icon && (
                <Icon label="Select an element" size={"lg"} icon={icon} color={"neutral-light"} />
            )}
            <Text size={"md"} className={"text-center text-neutral-strong my-sm"}>
                {message}
            </Text>
        </div>
    );
};
