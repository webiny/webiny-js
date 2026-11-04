import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as FilterListIcon } from "@webiny/icons/filter_list.svg";
import { ReactComponent as FolderIcon } from "@webiny/icons/folder.svg";
import { ReactComponent as PersonIcon } from "@webiny/icons/person.svg";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as SmartToyIcon } from "@webiny/icons/smart_toy.svg";
import type { PickerFieldIcon } from "./PickerFieldIcon.js";

const ICONS: Record<PickerFieldIcon, React.ReactElement> = {
    search: <SearchIcon />,
    person: <PersonIcon />,
    folder: <FolderIcon />,
    smart_toy: <SmartToyIcon />,
    filter_list: <FilterListIcon />
};

export interface PickerFieldIconViewProps {
    name: PickerFieldIcon;
}

/*
 * The leading icon of the closed picker field. It is decorative, so the accessible label is empty.
 * `data-picker-field-icon` names the icon for the tests.
 */
export const PickerFieldIconView = ({ name }: PickerFieldIconViewProps) => {
    return <Icon icon={ICONS[name]} label={""} size={"sm"} data-picker-field-icon={name} />;
};
