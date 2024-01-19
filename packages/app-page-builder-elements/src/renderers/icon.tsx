import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export type IconRenderer = ReturnType<typeof createIcon>;

export interface Props {
    markup?: string;
}

export const createIcon = () => {
    return createRenderer((props: Props) => {
        const { getElement } = useRenderer();
        const element = getElement();

        return (
            <div
                dangerouslySetInnerHTML={{
                    __html: props?.markup || element.data.icon?.value?.markup
                }}
            />
        );
    });
};
