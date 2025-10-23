import React from "react";
import { OverlayLoader } from "@webiny/admin-ui";

export const LoadingContentModel = () => {
    return (
        <div className={"w-screen h-screen fixed top-0 left-0 z-50"}>
            <OverlayLoader text={"Loading content model..."} />
        </div>
    );
};
