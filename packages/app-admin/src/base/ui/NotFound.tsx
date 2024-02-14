import React from "react";
import { createVoidComponent, makeDecoratable } from "@webiny/app";

export const NotFound = makeDecoratable("NotFound", () => {
    return <NotFoundRenderer />;
});

export const NotFoundRenderer = makeDecoratable("NotFoundRenderer", createVoidComponent());
