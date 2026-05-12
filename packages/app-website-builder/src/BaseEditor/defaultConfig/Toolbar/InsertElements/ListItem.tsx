import React from "react";
import { Icon } from "@webiny/admin-ui";
import type { ComponentGroupItem, ComponentManifest } from "@webiny/website-builder-sdk";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { InlineSvg } from "./InlineSvg.js";

const useComponent = (name: string) => {
    return useSelectFromEditor<ComponentManifest | undefined>(state => state.components?.[name]);
};

export const ListItem = ({ item }: { item: ComponentGroupItem }) => {
    const component = useComponent(item.name);
    if (!component) return <></>;

    return (
        <div className="flex flex-row items-center p-sm bg-neutral-light rounded-lg gap-sm cursor-grab fill-neutral-strong">
            <Icon label="Icon" icon={<InlineSvg src={component.image!} />} size={"md"} />
            <div className="text-sm font-medium text-neutral-primary">
                {component.label ?? component.name}
            </div>
        </div>
    );
};
