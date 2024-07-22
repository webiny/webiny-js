import React from "react";
import { DocumentNode } from "graphql";
import { makeDecoratable } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { generateAlphaNumericId } from "@webiny/utils";
import { ElementConfig } from "./Element";

declare module "graphql" {
    interface DocumentNode {
        __cacheKey: string;
    }
}

export interface GroupConfig {
    name: string;
    label: string;
    elements: ElementConfig[];
    querySelection?: DocumentNode;
}

export interface GroupProps {
    name: string;
    label?: string;
    children?: React.ReactNode;
    querySelection?: DocumentNode;
    remove?: boolean;
    before?: string;
    after?: string;
}

const withUniqueId = (node: DocumentNode) => {
    if (node.__cacheKey) {
        return node;
    }

    node.__cacheKey = generateAlphaNumericId(8);
    return node;
};

export const Group = makeDecoratable(
    "WebsiteSettingsGroup",
    ({ name, label, querySelection, children, remove, before, after }: GroupProps) => {
        const getId = useIdGenerator("group");

        const placeAfter = after !== undefined ? getId(after) : undefined;
        const placeBefore = before !== undefined ? getId(before) : undefined;

        return (
            <>
                <Property
                    id={getId(name)}
                    name={"groups"}
                    remove={remove}
                    array={true}
                    before={placeBefore}
                    after={placeAfter}
                >
                    <Property id={getId(name, "name")} name={"name"} value={name} />
                    {label ? (
                        <Property id={getId(name, "label")} name={"label"} value={label} />
                    ) : null}
                    {children ?? null}
                </Property>
                {querySelection ? (
                    <Property
                        id={`querySelections:${name}`}
                        array={true}
                        name={"querySelections"}
                        value={withUniqueId(querySelection)}
                    />
                ) : null}
            </>
        );
    }
);
