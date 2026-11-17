import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { Property } from "@webiny/react-properties";
import { useIdGenerator } from "@webiny/react-properties";
import type { PanelSide } from "./types.js";

export interface PanelProps {
    name: string;
    /** Which side of the canvas the panel is on. Default `"right"`. */
    side?: PanelSide;
    /** Written down the panel's strip while it is collapsed. Short: one or two words. */
    label?: string;
    /** The panel itself. It sizes itself and sets `data-affects-preview="width"`. */
    element?: React.JSX.Element;
    /** Whether the panel is open the first time the editor is used. Default `false`. */
    defaultOpen?: boolean;
    /** Whether the panel shows in a read-only editor. Default `true`. */
    showInReadOnly?: boolean;
    remove?: boolean;
    before?: string;
    after?: string;
}

/**
 * A panel beside the canvas. Panels on a side sit side by side, in the order they are registered,
 * the first one nearest the canvas, and each is open or collapsed to a narrow strip on its own.
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
            <Property id={`${id}:side`} name={"side"} value={props.side ?? "right"} />
            <Property id={`${id}:label`} name={"label"} value={props.label ?? props.name} />
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
