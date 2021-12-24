import React, { useEffect } from "react";
import { makeComposable } from "~/admin/makeComposable";

export const Brand = makeComposable("Brand", () => {
    return <BrandRenderer />;
});

export const BrandRenderer = makeComposable("BrandRenderer", () => {
    useEffect(() => {
        console.info(
            `<BrandRenderer/> is not implemented! To provide an implementation, use the <Compose/> component.`
        );
    }, []);

    return null;
});
