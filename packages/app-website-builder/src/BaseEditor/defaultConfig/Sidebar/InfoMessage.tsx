import type { ReactElement } from "react";
import React from "react";
import { Text, Icon } from "@webiny/admin-ui";

export interface InfoMessageProps {
    message: string;
    icon?: ReactElement;
}

export const InfoMessage = ({ message, icon }: InfoMessageProps) => {
    return (
        <div className={"bg-neutral-dimmed p-md flex flex-col items-center"}>
            {icon && (
                <Icon label="Select an element" size={"lg"} icon={icon} color={"neutral-light"} />
            )}
            <Text size={"md"} className={"text-center text-neutral-dimmed my-sm"}>
                {message}
            </Text>
        </div>
    );
};
