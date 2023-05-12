import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export type IconRenderer = ReturnType<typeof createIcon>;

export const createIcon = () => {
    return createRenderer(() => {
        const { getElement, theme } = useRenderer();

        const element = getElement();

        let color = element.data.icon.color;
        if (theme.styles.colors?.[color]) {
            color = theme.styles.colors?.[color];
        }

        return (
            <div style={{ color }} dangerouslySetInnerHTML={{ __html: element.data.icon.svg }} />
        );
    });
};
