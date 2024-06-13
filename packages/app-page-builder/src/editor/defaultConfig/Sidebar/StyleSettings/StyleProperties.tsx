import React, { useMemo } from "react";
import { ElementProperties, ElementProperty } from "~/editor/config/ElementProperty";
import { useElementPlugin } from "~/editor/contexts/EditorPageElementsProvider/useElementPlugin";
import { useActiveElement } from "~/editor";
import { Element } from "@webiny/app-page-builder-elements/types";
import { getPropertyName } from "../BackwardsCompatibility/StyleSettingsAdapter";

export const StyleProperties = () => {
    const [element] = useActiveElement<Element>();
    if (!element) {
        return null;
    }

    return <ElementStyleProperties element={element} />;
};

const ElementStyleProperties = ({ element }: { element: Element }) => {
    const plugin = useElementPlugin(element);
    if (!plugin) {
        return null;
    }

    const names = (plugin.settings || []) as string[] | string[][];

    const settings = useMemo(() => {
        return names
            .map(config => (Array.isArray(config) ? config[0] : config))
            .filter(name => name.startsWith("pb-editor-page-element-style-settings-"))
            .map(name => getPropertyName(name));
    }, [element.type]);

    return (
        <ElementProperties
            group={ElementProperty.STYLE}
            transform={elements => {
                return ["property", ...settings]
                    .map(name => elements.find(element => element.name === name))
                    .filter(Boolean) as typeof elements;
            }}
        />
    );
};
