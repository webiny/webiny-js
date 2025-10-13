import type { ReactElement } from "react";
import React from "react";
import { Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as FileIcon } from "@webiny/icons/description.svg";

export interface EmptyViewProps {
    icon?: ReactElement;
    title: string;
    action?: ReactElement | null;
}

export const EmptyView = ({ icon = <FileIcon />, title, action }: EmptyViewProps) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-md">
            <div className="flex justify-center">
                <div
                    style={{ width: 128, height: 128 }}
                    className="flex justify-center items-center bg-neutral-dimmed rounded-full fill-neutral-strong [&_svg]:size-[48px]"
                >
                    <Icon icon={icon} label={"Empty"} />
                </div>
            </div>
            <Text
                size={"md"}
                className={"text-center text-neutral-strong"}
                as={"div"}
                style={{ maxWidth: 276 }}
            >
                {title}
            </Text>
            {action && <div className={"flex justify-center gap-sm"}>{action}</div>}
        </div>
    );
};
