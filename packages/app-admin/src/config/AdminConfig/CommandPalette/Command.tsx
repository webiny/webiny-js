import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";

/**
 * A command contributed to the admin command palette. Modules register these via
 * `AdminConfig.CommandPalette.Command` to expose actions (e.g. "New entry",
 * "Publish", "Invite user") that run when selected.
 */
export interface CommandConfig {
    name: string;
    group: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    keywords?: string;
    shortcut?: string[];
    onSelect: () => void;
}

export interface CommandProps {
    /* Unique id, also used for `before`/`after` ordering references. */
    name: string;
    label: string;
    onSelect: () => void;
    /* Group heading in the palette. Defaults to "Actions". */
    group?: string;
    description?: string;
    icon?: React.ReactNode;
    /* Extra search terms that don't appear in the label/description. */
    keywords?: string;
    /* Display-only keyboard shortcut chips, e.g. ["⌘", "N"]. */
    shortcut?: string[];
    remove?: boolean;
    pin?: "first" | "last";
    before?: string;
    after?: string;
}

export const Command = ({
    name,
    label,
    onSelect,
    group = "Actions",
    description,
    icon,
    keywords,
    shortcut,
    remove,
    pin,
    before,
    after
}: CommandProps) => {
    const getId = useIdGenerator("CommandPaletteCommand");

    let placeAfter = after !== undefined ? getId(after) : undefined;
    let placeBefore = before !== undefined ? getId(before) : undefined;
    if (pin === "first") {
        placeBefore = "$first";
    } else if (pin === "last") {
        placeAfter = "$last";
    }

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property
                id={getId(name)}
                name={"commands"}
                remove={remove}
                array={true}
                before={placeBefore}
                after={placeAfter}
                value={{ name, group, label, description, icon, keywords, shortcut, onSelect }}
            />
        </ConnectToProperties>
    );
};
