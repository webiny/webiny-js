import React, { useEffect } from "react";
import { makeComposable } from "~/admin/makeComposable";

export const LocaleSelector = makeComposable("LocaleSelector", () => {
    return <LocaleSelectorRenderer />;
});

export const LocaleSelectorRenderer = makeComposable("LocaleSelectorRenderer", () => {
    useEffect(() => {
        console.info(
            `<LocaleSelectorRenderer/> is not implemented! To provide an implementation, use the <Compose/> component.`
        );
    }, []);

    return null;
});
