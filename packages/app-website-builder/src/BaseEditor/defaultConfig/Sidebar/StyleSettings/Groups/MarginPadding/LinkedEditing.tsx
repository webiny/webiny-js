import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as LinkOn } from "@webiny/icons/link.svg";
import { ReactComponent as LinkOff } from "@webiny/icons/link_off.svg";

interface LinkedEditingProps {
    linked: boolean;
    onToggle: (linked: boolean) => void;
}

export const LinkedEditing = ({ linked, onToggle }: LinkedEditingProps) => {
    return (
        <div
            className={"absolute cursor-pointer fill-neutral-strong"}
            style={{ top: 2, right: 4 }}
        >
            {linked ? (
                <Icon
                    icon={<LinkOff />}
                    label={"Disable linked editing."}
                    size={"sm"}
                    onClick={() => onToggle(false)}
                />
            ) : (
                <Icon
                    icon={<LinkOn />}
                    label={"Enable linked editing."}
                    size={"sm"}
                    onClick={() => onToggle(true)}
                />
            )}
        </div>
    );
};
