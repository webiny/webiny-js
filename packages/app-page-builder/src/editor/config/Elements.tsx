import React, { useMemo } from "react";
import { useEditorConfig } from "./EditorConfig";
import { ElementConfig } from "~/editor/config/Element";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-editor-ui-elements": React.HTMLProps<HTMLDivElement>;
            "pb-editor-ui-element": React.HTMLProps<HTMLDivElement>;
        }
    }
}

export interface ElementsProps {
    group?: string;
    scope?: string;
    transform?: (elements: ElementConfig[]) => ElementConfig[];
}

const passthrough = () => true;

const byGroup = (group?: string) => {
    return group ? (item: ElementConfig) => item.group === group : passthrough;
};
const byScope = (scope?: string) => {
    return scope ? (item: ElementConfig) => item.scope === scope : passthrough;
};

const defaultTransform = (elements: ElementConfig[]) => elements;

export const Elements = ({ group, scope, transform = defaultTransform }: ElementsProps) => {
    const { elements } = useEditorConfig();

    const groupElements = useMemo(() => {
        return elements.filter(byGroup(group)).filter(byScope(scope));
    }, [elements, group, scope]);

    return (
        <pb-editor-ui-elements data-scope={scope} data-group={group}>
            {transform(groupElements).map(element => (
                <pb-editor-ui-element key={element.name} data-name={element.name}>
                    {element.element}
                </pb-editor-ui-element>
            ))}
        </pb-editor-ui-elements>
    );
};
