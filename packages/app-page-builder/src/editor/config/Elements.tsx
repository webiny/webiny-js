import React, { useMemo } from "react";
import { useEditorConfig } from "./EditorConfig";
import { ElementConfig } from "~/editor/config/Element";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-editor-elements": React.HTMLProps<HTMLDivElement>;
            "pb-editor-element": React.HTMLProps<HTMLDivElement>;
        }
    }
}

export interface ElementsProps {
    group?: string;
    scope?: string;
}

const passthrough = () => true;

const byGroup = (group?: string) => {
    return group ? (item: ElementConfig) => item.group === group : passthrough;
};
const byScope = (scope?: string) => {
    return scope ? (item: ElementConfig) => item.scope === scope : passthrough;
};

export const Elements = ({ group, scope }: ElementsProps) => {
    const { elements } = useEditorConfig();

    const groupElements = useMemo(() => {
        return elements.filter(byGroup(group)).filter(byScope(scope));
    }, [elements, group, scope]);

    return (
        <pb-editor-elements data-scope={scope} data-group={group}>
            {groupElements.map(element => (
                <pb-editor-element key={element.name} data-name={element.name}>
                    {element.element}
                </pb-editor-element>
            ))}
        </pb-editor-elements>
    );
};
