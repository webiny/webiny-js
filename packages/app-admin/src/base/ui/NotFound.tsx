import React from "react";
import { makeComposable } from "@webiny/app";

export const NotFound = makeComposable("NotFound", () => {
    return <NotFoundRenderer />;
});

export const NotFoundRenderer = makeComposable("NotFoundRenderer");
