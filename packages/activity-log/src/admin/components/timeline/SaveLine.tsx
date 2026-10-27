import React from "react";
import { cn, Text } from "@webiny/admin-ui";
import type { DisclosedSave } from "~/admin/timeline/summariseItem.js";
import { TYPE } from "../typeScale.js";
import { formatClock } from "./formatTime.js";
import { FieldGroup } from "./FieldGroup.js";

/**
 * One save in the ledger: its clock, then the fields it touched.
 *
 * No sentence of its own. The run above it carries the sentence — generated, exact, or naming the
 * fields — and repeating a description per save was most of what made five fields take five lines.
 */
export const SaveLine = ({ save, showTime }: { save: DisclosedSave; showTime: boolean }) => (
    <div className={"flex items-baseline gap-xs"}>
        {showTime ? (
            <Text
                className={cn(
                    TYPE.meta,
                    "shrink-0 tabular-nums whitespace-nowrap text-neutral-disabled"
                )}
            >
                {formatClock(save.timestamp, true)}
            </Text>
        ) : null}
        <div className={"flex min-w-0 flex-1 flex-col gap-xxs"}>
            {save.groups.map((group, index) => (
                <FieldGroup key={`${group.fullPath}-${index}`} group={group} />
            ))}
        </div>
    </div>
);
