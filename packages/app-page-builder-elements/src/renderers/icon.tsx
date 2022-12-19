import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export const createIcon = () => {
    return createRenderer(() => {
        const { getElement, getAttributes, theme } = useRenderer();

        const element = getElement();

        let color = element.data.icon.color;
        if (theme.styles.colors?.[color]?.base) {
            color = theme.styles.colors?.[color]?.base;
        }

        return (
            <div
                {...getAttributes()}
                style={{ color }}
                dangerouslySetInnerHTML={{ __html: element.data.icon.svg }}
            />
        );
    });
};
