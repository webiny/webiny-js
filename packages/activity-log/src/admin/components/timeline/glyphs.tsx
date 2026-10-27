import React from "react";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as KeyIcon } from "@webiny/icons/key.svg";
import { ReactComponent as RemoveIcon } from "@webiny/icons/remove.svg";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/schedule.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { ReactComponent as SwapVertIcon } from "@webiny/icons/swap_vert.svg";
import type { MachineIcon } from "~/admin/timeline/describeActor.js";

export const MACHINE_ICONS: Record<MachineIcon, React.ReactElement> = {
    key: <KeyIcon />,
    task: <ScheduleIcon />,
    system: <SettingsIcon />
};

/**
 * Operation glyphs. Colour carries the meaning here — added, removed and moved are the three
 * structural outcomes a reader scans for — so each takes a semantic fill rather than a neutral.
 *
 * An ordinary edit has no entry and takes no glyph. It is the default, and a mark on every chip
 * would spend the reader's attention on the case that never needs it.
 */
export const OPERATION_ICONS: Record<string, { icon: React.ReactElement; className: string }> = {
    added: { icon: <AddIcon />, className: "fill-success" },
    removed: { icon: <RemoveIcon />, className: "fill-destructive" },
    moved: { icon: <SwapVertIcon />, className: "fill-warning" },
    replaced: { icon: <SwapVertIcon />, className: "fill-warning" }
};
