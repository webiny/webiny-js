import React from "react";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { Element } from "~/types";

interface Props {
    elements?: Element[];
}

export type DocumentRenderer = ReturnType<typeof createDocument>;

export const createDocument = () => {
    return createRenderer<Props>(() => {
        const { getAttributes, getElement } = useRenderer();

        return (
            <div className={"webiny-pb-page-document"} {...getAttributes()}>
                <Elements element={getElement()} />
            </div>
        );
    });
};
