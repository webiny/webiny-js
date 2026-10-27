import React from "react";
import { Avatar, Icon } from "@webiny/admin-ui";
import { avatarColor, type MachineIcon } from "~/admin/timeline/describeActor.js";
import { MACHINE_ICONS } from "./glyphs.js";

/**
 * Initials for a person, a glyph for a machine, and neither for an actor the reader may not see.
 *
 * A person's circle takes its colour from their name, which is how the comments drawer draws the
 * same person — see `avatarColor`. It replaced the theme's `strong` variant, which painted every
 * actor the same accent orange: on a timeline where one row in three is a different person, a
 * column of identical circles is decoration, whereas a column of distinct ones is scannable.
 */
export const ActorAvatar = ({
    kind,
    initials,
    machineIcon,
    name
}: {
    kind: "person" | "machine" | "redacted";
    initials: string;
    machineIcon: MachineIcon | null;
    name: string;
}) => {
    if (kind === "machine" && machineIcon) {
        return (
            <Avatar
                size={"sm"}
                variant={"light"}
                fallback={
                    <Avatar.Fallback>
                        <Icon size={"sm"} label={name} icon={MACHINE_ICONS[machineIcon]} />
                    </Avatar.Fallback>
                }
            />
        );
    }

    /*
      No `rounded-full` and no size override: `Avatar`'s own defaults are a 24px rounded square
      with 14/600 initials, which is what comments renders because it passes neither. The circle
      and the 11px type were this panel's alone, and two different avatars for the same colleague
      on the same screen is the thing being fixed here.
    */
    return (
        <Avatar
            size={"sm"}
            variant={"light"}
            image={undefined}
            fallback={
                <Avatar.Fallback
                    style={
                        kind === "redacted"
                            ? undefined
                            : { backgroundColor: avatarColor(name), color: "#fff" }
                    }
                >
                    {initials === "" ? "?" : initials}
                </Avatar.Fallback>
            }
        />
    );
};
