import React from "react";
import { Tag, Text, TimeAgo } from "@webiny/admin-ui";

interface LiveTagProps {
    version: number;
    lastPublishedOn?: string | null;
}

export const LiveTag = ({ version, lastPublishedOn }: LiveTagProps) => (
    <div className={"flex flex-col gap-xxs"}>
        <Tag swatchColor={"#5AC84C"} variant={"success-light"} content={`Live (v${version})`} />
        {lastPublishedOn ? (
            <Text size={"sm"} className={"text-neutral-strong"}>
                <TimeAgo datetime={lastPublishedOn} />
            </Text>
        ) : null}
    </div>
);
