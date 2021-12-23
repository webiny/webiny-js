import React, { useEffect } from "react";
import { makeComposable } from "~/admin/makeComposable";

export interface BrandProps {
    location?: string;
}

export const Brand = makeComposable<BrandProps>("Brand", props => {
    return <BrandRenderer {...props} />;
});

export type BrandRendererProps = BrandProps;

export const BrandRenderer = makeComposable<BrandRendererProps>("BrandRenderer", () => {
    useEffect(() => {
        console.info(
            `<BrandRenderer/> is not implemented! To provide an implementation, use the <Compose/> component.`
        );
    }, []);

    return null;
});
