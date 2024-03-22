import React, { Fragment, useMemo } from "react";
import { useEditorConfig } from "./EditorConfig";
import { ElementConfig } from "~/editor/config/Element";

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
        <>
            {groupElements.map(element => (
                <Fragment key={element.name}>{element.element}</Fragment>
            ))}
        </>
    );
};
