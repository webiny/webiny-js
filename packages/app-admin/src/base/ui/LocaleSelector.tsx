import React from "react";
import { createVoidComponent, makeDecoratable } from "@webiny/app";

export const LocaleSelector = makeDecoratable("LocaleSelector", () => {
    return <LocaleSelectorRenderer />;
});

export const LocaleSelectorRenderer = makeDecoratable(
    "LocaleSelectorRenderer",
    createVoidComponent()
);
