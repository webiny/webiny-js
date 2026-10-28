import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as DevicesOtherIcon } from "@webiny/icons/devices_other.svg";
import { ReactComponent as FolderIcon } from "@webiny/icons/folder.svg";
import { ReactComponent as FolderOpenIcon } from "@webiny/icons/folder_open.svg";
import { ReactComponent as GroupIcon } from "@webiny/icons/group.svg";
import { ReactComponent as GroupOffIcon } from "@webiny/icons/group_off.svg";
import { ReactComponent as GroupsIcon } from "@webiny/icons/groups.svg";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import { ReactComponent as PersonIcon } from "@webiny/icons/person.svg";
import { ReactComponent as PersonOffIcon } from "@webiny/icons/person_off.svg";
import { ReactComponent as WebIcon } from "@webiny/icons/web.svg";
import type { PickerOptionIcon } from "./PickerOptionIcon.js";

const ICONS: Record<PickerOptionIcon, React.ReactElement> = {
    person: <PersonIcon />,
    person_off: <PersonOffIcon />,
    group: <GroupIcon />,
    group_off: <GroupOffIcon />,
    groups: <GroupsIcon />,
    folder: <FolderIcon />,
    folder_open: <FolderOpenIcon />,
    lock: <LockIcon />,
    web: <WebIcon />,
    devices_other: <DevicesOtherIcon />
};

export interface PickerOptionIconViewProps {
    name: PickerOptionIcon;
    muted: boolean;
}

/*
 * The icon column of a picker row (R307). It is decorative: the label next to it says what the row
 * is, so the accessible label is empty. `data-picker-icon` names the icon for the tests.
 */
export const PickerOptionIconView = ({ name, muted }: PickerOptionIconViewProps) => {
    let color: "inherit" | "neutral-light" = "inherit";
    if (muted) {
        color = "neutral-light";
    }
    return <Icon icon={ICONS[name]} label={""} size={"sm"} color={color} data-picker-icon={name} />;
};
