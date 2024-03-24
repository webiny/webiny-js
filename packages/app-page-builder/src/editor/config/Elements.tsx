import React, { Fragment, useMemo } from "react";
import { useEditorConfig } from "./EditorConfig";
import { ElementConfig } from "~/editor/config/Element";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-editor-elements": React.HTMLProps<HTMLDivElement>;
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

const ignore = { display: "contents" };

export const Elements = ({ group, scope }: ElementsProps) => {
    const { elements } = useEditorConfig();

    const groupElements = useMemo(() => {
        return elements.filter(byGroup(group)).filter(byScope(scope));
    }, [elements, group, scope]);

    return (
        <pb-editor-elements data-scope={scope} data-group={group} style={ignore}>
            {groupElements.map(element => (
                <Fragment key={element.name}>{element.element}</Fragment>
            ))}
        </pb-editor-elements>
    );
};
