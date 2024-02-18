import React from "react";
import { createDecorator } from "@webiny/react-composition";
import { EditorBar } from "~/editor";
import { PageOptionsMenu } from "~/pageEditor";

export const PageOptionsMenuPlugin = createDecorator(EditorBar.RightSection, RightSection => {
    return function AddRevisionSelector(props) {
        return (
            <RightSection>
                <PageOptionsMenu items={[]} />
                {props.children}
            </RightSection>
        );
    };
});
