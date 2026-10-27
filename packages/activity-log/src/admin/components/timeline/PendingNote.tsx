import React from "react";
import { cn, Skeleton, Text } from "@webiny/admin-ui";
import { TYPE } from "../typeScale.js";

/** A summary that has not arrived yet, holding the line it will take. */
export const PendingNote = () => (
    <div className={"flex items-center gap-xs"}>
        <Skeleton type={"text"} size={"xs"} className={"max-w-[170px]"} />
        <Text className={cn(TYPE.meta, "whitespace-nowrap text-neutral-strong")}>
            {"Summarising"}
        </Text>
    </div>
);
