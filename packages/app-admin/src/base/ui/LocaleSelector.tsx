import React from "react";
import { makeComposable } from "@webiny/app";

export const LocaleSelector = makeComposable("LocaleSelector", () => {
    return <LocaleSelectorRenderer />;
});

export const LocaleSelectorRenderer = makeComposable("LocaleSelectorRenderer");
