import React from "react";
import { Grid } from "@webiny/admin-ui";
import type { InputAstNode } from "@webiny/website-builder-sdk";
import { InputField } from "./InputField.js";
import { ActiveElement } from "./ActiveElement.js";

export const InputRenderer = ({ ast }: { ast: InputAstNode[] }) => {
    return (
        <>
            {ast.map(node =>
                node.input.hideFromUi ? null : (
                    <Grid.Column span={12} key={node.path}>
                        <ActiveElement>
                            {element => (
                                <InputField key={node.path} element={element} node={node} />
                            )}
                        </ActiveElement>
                    </Grid.Column>
                )
            )}
        </>
    );
};
