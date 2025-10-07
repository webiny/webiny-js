import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as PinIcon } from "@webiny/icons/push_pin.svg";
import { useLocalStorage, useLocalStorageValue } from "@webiny/app";

type PinnableMenuItemProps = {
    name: string;
    children: React.ReactNode;
};

export const getPinnedKey = (name: string) => `navigation/${name}/pinned`;

/**
 * PinnableMenuItem component allows any menu item to be "pinned" by the user.
 * The pinned state is persisted in localStorage, making the menu item visually distinct and easily accessible.
 *
 * @param props - Component props.
 * @param props.name - string. Unique name for the menu item, used for localStorage key.
 * @param props.children - React.ReactNode. The menu item content to render.
 * @returns JSX.Element. Renders the children and a pin/unpin icon.
 *
 * Side Effects:
 * - Updates localStorage when pinning/unpinning.
 *
 * Example usage:
 * ```tsx
 * <PinnableMenuItem name="dashboard">
 *   <MenuItem label="Dashboard" />
 * </PinnableMenuItem>
 * ```
 */
export const PinnableMenuItem = (props: PinnableMenuItemProps) => {
    const localStorageKey = getPinnedKey(props.name);
    const isPinned = useLocalStorageValue(localStorageKey);
    const { set, remove } = useLocalStorage();

    const pinMenuItem = () => set(localStorageKey, true);
    const unpinMenuItem = () => remove(localStorageKey);

    return (
        <div className="wby-relative">
            {props.children}
            <div
                className={`wby-opacity-0 hover:wby-opacity-100 wby-absolute wby-right-sm wby-top-1/2 -wby-translate-y-1/2 wby-cursor-pointeri ${isPinned ? "wby-opacity-100" : ""}`}
            >
                <Icon
                    label={isPinned ? "Unpin menu item" : "Pin menu item"}
                    onClick={isPinned ? unpinMenuItem : pinMenuItem}
                    icon={<PinIcon />}
                    className="wby-fill-neutral-strong hover:wby-fill-neutral-xstrong"
                />
            </div>
        </div>
    );
};
