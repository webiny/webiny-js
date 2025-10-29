import React from "react";
import { Margin } from "./Margin.js";
import { Padding } from "./Padding.js";

export const MarginPaddingControl = ({ elementId }: { elementId: string }) => {
    return (
        <div className="bg-neutral-light text-neutral-strong w-full rounded-md border-sm border-neutral-muted">
            <Margin elementId={elementId}>
                <Padding elementId={elementId} />
            </Margin>
        </div>
    );
};
