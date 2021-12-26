import React from "react";
import { makeComposable } from "@webiny/app-admin-core";

export const LocaleSelector = makeComposable("LocaleSelector", () => {
    return <LocaleSelectorRenderer />;
});

export const LocaleSelectorRenderer = makeComposable("LocaleSelectorRenderer");
