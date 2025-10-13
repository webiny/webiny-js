import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as AddLinkIcon } from "@webiny/icons/add_link.svg";
import { ReactComponent as RemoveLinkIcon } from "@webiny/icons/link_off.svg";
import React, { useCallback } from "react";

interface WithBindingToggleProps {
    type: "static" | "expression";
    setBindingType: (value: "static" | "expression") => void;
    children: React.ReactNode;
}

const addIcon = <AddLinkIcon />;
const removeIcon = <RemoveLinkIcon />;

export const WithBindingToggle = ({ setBindingType, type, children }: WithBindingToggleProps) => {
    const onClick = useCallback(() => {
        setBindingType(type === "static" ? "expression" : "static");
    }, [type, setBindingType]);

    return (
        <div className={"relative"}>
            <IconButton
                className={"absolute right-0"}
                variant={"ghost"}
                size={"sm"}
                icon={type === "static" ? addIcon : removeIcon}
                onClick={onClick}
            />
            {children}
        </div>
    );
};
