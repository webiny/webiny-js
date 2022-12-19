import React from "react";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export const createDocument = () => {
    return createRenderer(() => {
        const { getElement, getAttributes } = useRenderer();

        return (
            <div className={"webiny-pb-page-document"} {...getAttributes()}>
                <Elements element={getElement()} />
            </div>
        );
    });
};
