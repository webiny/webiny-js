import React, { useMemo } from "react";
import { useEditorConfig } from "./EditorConfig.js";
import type { ElementConfig } from "./Element.js";

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "wb-editor-ui-elements": {
                class?: string;
                "data-scope"?: string;
                "data-group"?: string;
                [key: string]: any;
            };
            "wb-editor-ui-element": {
                class?: string;
                "data-name"?: string;
                [key: string]: any;
            };
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
        <wb-editor-ui-elements data-scope={scope} data-group={group} class={"wby-contents"}>
            {transform(groupElements).map(element => (
                <wb-editor-ui-element
                    key={element.name}
                    data-name={element.name}
                    class={"wby-contents"}
                >
                    {element.element}
                </wb-editor-ui-element>
            ))}
        </wb-editor-ui-elements>
    );
};
