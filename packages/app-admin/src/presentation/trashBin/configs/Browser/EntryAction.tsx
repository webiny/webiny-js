import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { OptionsMenuItem } from "~/components/OptionsMenu/index.js";

export interface EntryActionConfig {
    name: string;
    element: React.ReactElement;
}

export interface EntryActionProps {
    name: string;
    element?: React.ReactElement;
    remove?: boolean;
    before?: string;
    after?: string;
}

const BaseEntryAction = ({
    name,
    after = undefined,
    before = undefined,
    remove = false,
    element
}: EntryActionProps) => {
    const getId = useIdGenerator("recordAction");

    const placeAfter = after !== undefined ? getId(after) : undefined;
    const placeBefore = before !== undefined ? getId(before) : undefined;

    return (
        <CompositionScope name={"trash"}>
            <Property id="record" name={"record"}>
                <Property
                    id={getId(name)}
                    name={"actions"}
                    remove={remove}
                    array={true}
                    before={placeBefore}
                    after={placeAfter}
                >
                    <Property id={getId(name, "name")} name={"name"} value={name} />
                    {element ? (
                        <Property id={getId(name, "element")} name={"element"} value={element} />
                    ) : null}
                </Property>
            </Property>
        </CompositionScope>
    );
};

export const EntryAction = Object.assign(BaseEntryAction, {
    OptionsMenuItem
});
