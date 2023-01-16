import React from "react";

import { OEmbed } from "./components/OEmbed";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export const createSoundcloud = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();

        return <OEmbed element={getElement()} />;
    });
};
