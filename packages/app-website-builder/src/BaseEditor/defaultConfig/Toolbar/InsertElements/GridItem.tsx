import React from "react";
import { Icon } from "@webiny/admin-ui";
import type { ComponentGroupItem, ComponentManifest } from "@webiny/website-builder-sdk";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { InlineSvg } from "./InlineSvg.js";

const useComponent = (name: string) => {
    return useSelectFromEditor<ComponentManifest | undefined>(state => state.components?.[name]);
};

export const GridItem = ({ item }: { item: ComponentGroupItem }) => {
    const component = useComponent(item.name);
    if (!component) return <></>;

    return (
        <div className="flex flex-col items-center justify-center gap-sm px-sm py-md bg-neutral-light rounded-lg cursor-grab fill-neutral-strong w-[80px] min-h-[80px]">
            <Icon
                label="Icon"
                icon={<InlineSvg src={component.image!} />}
                size={"lg"}
                color={"neutral-strong"}
            />
            <div className="text-sm font-medium text-neutral-strong text-center leading-tight">
                {component.label ?? component.name}
            </div>
        </div>
    );
};
