import React from "react";
import { Icon, Tag } from "@webiny/admin-ui";
import type { DescribedChange } from "~/admin/timeline/describeChange.js";
import { OPERATION_ICONS } from "./glyphs.js";

/**
 * One changed field, as a chip.
 *
 * A chip rather than a row, which is the change that makes a heavy save readable: five fields were
 * five lines each carrying an icon and a name, and are now one wrapping line. The operation keeps
 * its colour, because added, removed and moved are the three outcomes a reader scans for and they
 * are worth a glyph; an ordinary edit is the default and takes none.
 */
export const FieldChip = ({ change }: { change: DescribedChange }) => {
    const operation = change.operation ?? "";
    const glyph = OPERATION_ICONS[operation];

    return (
        <Tag
            variant={"neutral-light"}
            content={
                <span className={"flex items-center gap-xxs"}>
                    {glyph ? (
                        <Icon
                            size={"sm"}
                            color={"inherit"}
                            className={glyph.className}
                            label={operation}
                            icon={glyph.icon}
                        />
                    ) : null}
                    <span>{change.label}</span>
                    {change.position === undefined ? null : (
                        <span className={"text-neutral-strong"}>{`· item ${change.position}`}</span>
                    )}
                </span>
            }
        />
    );
};
