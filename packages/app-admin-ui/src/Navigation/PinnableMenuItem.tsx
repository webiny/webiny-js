import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as PinIcon } from "@webiny/icons/push_pin.svg";
import { ReactComponent as PinOffIcon } from "@webiny/icons/push_pin_off.svg";
import { useLocalStorage, useLocalStorageValue } from "@webiny/app";

type PinnableMenuItemProps = {
    name: string;
    children: React.ReactNode;
};

export const getPinnedKey = (name: string) => `navigation/${name}/pinned`;

export const PinnableMenuItem = (props: PinnableMenuItemProps) => {
    const localStorageKey = getPinnedKey(props.name);
    const isPinned = useLocalStorageValue(localStorageKey);
    const { set, remove } = useLocalStorage();

    const pinMenuItem = () => set(localStorageKey, true);
    const unpinMenuItem = () => remove(localStorageKey);

    return (
        <div className="wby-relative">
            {props.children}
            <div className="wby-absolute wby-right-sm wby-top-1/2 -wby-translate-y-1/2 wby-cursor-pointer">
                <Icon
                    label={isPinned ? "Unpin menu item" : "Pin menu item"}
                    onClick={isPinned ? unpinMenuItem : pinMenuItem}
                    icon={isPinned ? <PinOffIcon /> : <PinIcon />}
                    className="wby-fill-neutral-strong hover:wby-fill-neutral-xstrong"
                />
            </div>
        </div>
    );
};
