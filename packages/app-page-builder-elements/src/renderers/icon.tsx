import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { IconPicker } from "@webiny/app-admin/components/IconPicker";

export type IconRenderer = ReturnType<typeof createIcon>;

export interface Props {
    svg?: string;
}

export const createIcon = () => {
    return createRenderer((props: Props) => {
        const { getElement } = useRenderer();

        const element = getElement();

        if (props.svg) {
            <div dangerouslySetInnerHTML={{ __html: props?.svg }} />;
        }

        return <IconPicker.Icon icon={element.data.icon?.value} size={element.data.icon?.width} />;
    });
};
