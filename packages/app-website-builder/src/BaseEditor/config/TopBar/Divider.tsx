import React from "react";
import { makeDecoratable } from "@webiny/app-admin";

export const Divider = makeDecoratable("TopBarDivider", () => {
    return <div className={"w-px mx-[5px] h-full flex-none"} />;
});
