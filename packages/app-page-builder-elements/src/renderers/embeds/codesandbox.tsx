import React from "react";

import { OEmbed } from "./components/OEmbed";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export const createCodesandbox = () => {
    return createRenderer(() => {
        const { getAttributes, getElement } = useRenderer();

        return (
            <div {...getAttributes()}>
                <OEmbed element={getElement()} />
            </div>
        );
    });
};
