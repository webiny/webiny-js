import React from "react";
import { Thumbnail } from "./Thumbnail.js";
import { cn } from "@webiny/admin-ui";

export const Preview = () => {
    return (
        <div className={"h-full w-full"}>
            <div
                className={cn([
                    "flex items-center justify-center",
                    "w-full aspect-square rounded-lg bg-neutral-dimmed",
                    "overflow-hidden"
                ])}
            >
                <Thumbnail />
            </div>
        </div>
    );
};
