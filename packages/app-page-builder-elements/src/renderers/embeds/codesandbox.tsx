import React from "react";

import { OEmbed } from "./components/OEmbed";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export const createCodesandbox = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();
        const element = getElement();

        return <OEmbed element={element} />;
    });
};
