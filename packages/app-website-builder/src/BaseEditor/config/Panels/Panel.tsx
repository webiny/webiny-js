import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { Property } from "@webiny/react-properties";
import { useIdGenerator } from "@webiny/react-properties";

export interface PanelProps {
    name: string;
    /** Written down the rail. Short: one or two words. */
    label?: string;
    icon?: React.JSX.Element;
    /** The panel itself. It sizes itself and sets `data-affects-preview="width"`. */
    element?: React.JSX.Element;
    /** Whether the panel is open the first time the editor is used. Default `false`. */
    defaultOpen?: boolean;
    /** Whether the panel's tab shows in a read-only editor. Default `true`. */
    showInReadOnly?: boolean;
    remove?: boolean;
    before?: string;
    after?: string;
}

/**
 * A panel on the right of the editor, opened and closed from its tab on the rail. Open panels sit
 * side by side, in the order they are registered, the first one nearest the canvas.
 */
export const Panel = makeDecoratable("EditorPanel", (props: PanelProps) => {
    const getId = useIdGenerator("panel");
    const id = getId(props.name);
    let before: string | undefined;
    if (props.before) {
        before = getId(props.before);
    }
    let after: string | undefined;
    if (props.after) {
        after = getId(props.after);
    }

    return (
        <Property
            id={id}
            name={"panels"}
            remove={props.remove}
            array={true}
            before={before}
            after={after}
        >
            <Property id={`${id}:name`} name={"name"} value={props.name} />
            <Property id={`${id}:label`} name={"label"} value={props.label ?? props.name} />
            <Property id={`${id}:icon`} name={"icon"} value={props.icon} />
            <Property id={`${id}:element`} name={"element"} value={props.element} />
            <Property
                id={`${id}:defaultOpen`}
                name={"defaultOpen"}
                value={props.defaultOpen ?? false}
            />
            <Property
                id={`${id}:showInReadOnly`}
                name={"showInReadOnly"}
                value={props.showInReadOnly ?? true}
            />
        </Property>
    );
});
