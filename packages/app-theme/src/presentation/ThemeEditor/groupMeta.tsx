import React from "react";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as PaletteIcon } from "@webiny/icons/palette.svg";
import { ReactComponent as TypographyIcon } from "@webiny/icons/text_fields.svg";
import { ReactComponent as SpacingIcon } from "@webiny/icons/width_normal.svg";
import { ReactComponent as RadiusIcon } from "@webiny/icons/rounded_corner.svg";
import { ReactComponent as ShadowsIcon } from "@webiny/icons/layers.svg";
import { ReactComponent as PolicyIcon } from "@webiny/icons/shield.svg";
import { EDITOR_GROUPS, type EditorGroupId } from "~/constants.js";

export type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/** The icon name on each group (see `EDITOR_GROUPS`) maps to a component here. */
export const GROUP_ICONS: Record<string, IconComponent> = {
    palette: PaletteIcon,
    text_fields: TypographyIcon,
    width_normal: SpacingIcon,
    rounded_corner: RadiusIcon,
    layers: ShadowsIcon,
    shield: PolicyIcon
};

/**
 * The leading segment of a token path tells you which editor group owns it — `color.*` is edited on
 * Colors, `space.*` on Spacing, and so on. Typography owns three prefixes (the type-size ramp, the
 * roles, and the fonts). This is what lets a publish blocker or an accessibility warning point at the
 * screen where it can be fixed.
 */
const PREFIX_TO_GROUP: Record<string, EditorGroupId> = {
    color: "colors",
    space: "spacing",
    radius: "radius",
    shadow: "shadows",
    text: "typography",
    type: "typography",
    font: "typography"
};

export const groupForTokenPath = (path?: string): EditorGroupId | null => {
    if (!path) {
        return null;
    }
    return PREFIX_TO_GROUP[path.split(".")[0]] ?? null;
};

const groupInfo = (id: EditorGroupId): { label: string; Icon: IconComponent | undefined } => {
    const group = EDITOR_GROUPS.find(candidate => candidate.id === id);
    return { label: group?.label ?? id, Icon: group ? GROUP_ICONS[group.icon] : undefined };
};

/**
 * A small "which screen fixes this" chip — the group's icon and name — derived from a token path.
 * Renders nothing when the path doesn't map to a group (e.g. a document-level blocker), so callers
 * can drop it in unconditionally.
 */
export const GroupChip = ({ path }: { path?: string }) => {
    const group = groupForTokenPath(path);
    if (!group) {
        return null;
    }
    const { label, Icon } = groupInfo(group);
    return (
        <span className="inline-flex flex-none items-center gap-xs rounded-sm bg-neutral-light px-xs py-xxs">
            {Icon ? <Icon className="size-4 flex-none fill-neutral-strong" /> : null}
            <Text size="sm" className="text-neutral-strong">
                {label}
            </Text>
        </span>
    );
};
