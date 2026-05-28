import React from "react";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import { useComponent } from "~/BaseEditor/hooks/useComponent.js";
import { Icon } from "@webiny/admin-ui";
import { InlineSvg } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/InlineSvg.js";

interface ElementPreviewProps {
    element: DocumentElement;
}

export const ElementPreview = ({ element }: ElementPreviewProps) => {
    const component = useComponent(element.component.name);

    return (
        <div className={"flex items-center gap-sm"}>
            <div className={"fill-accent-default"}>
                {component.image && (
                    <Icon
                        icon={<InlineSvg src={component.image} />}
                        size={"md"}
                        label={component.label ?? element.component.name}
                    />
                )}
            </div>
            <span className={"text-md font-semibold text-neutral-primary"}>
                {component.label ?? element.component.name}
            </span>
        </div>
    );
};
