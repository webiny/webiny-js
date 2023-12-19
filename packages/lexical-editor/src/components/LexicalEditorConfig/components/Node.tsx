import React from "react";
import { Property } from "@webiny/react-properties";
import { Klass, LexicalNode } from "lexical";

export interface NodeConfig {
    name: string;
    node: Klass<LexicalNode>;
}

export interface NodeProps {
    name: string;
    node?: Klass<LexicalNode>;
    remove?: boolean;
    before?: string;
    after?: string;
}

export const Node = ({
    name,
    node,
    after = undefined,
    before = undefined,
    remove = false
}: NodeProps) => {
    const placeBefore = before !== undefined ? `node:${before}` : undefined;
    const placeAfter = after !== undefined ? `node:${after}` : undefined;

    return (
        <Property
            id={`nodes:${name}`}
            name={"nodes"}
            array={true}
            before={placeBefore}
            after={placeAfter}
            remove={remove}
        >
            <Property id={`node:${name}:name`} name={"name"} value={name} />
            {node ? <Property id={`node:${name}:node`} name={"node"} value={node} /> : null}
        </Property>
    );
};
