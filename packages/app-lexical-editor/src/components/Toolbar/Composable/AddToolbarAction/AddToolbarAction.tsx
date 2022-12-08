import React, { FC } from "react";
import { Toolbar } from "~/components/Toolbar/Toolbar";
import { createComponentPlugin } from "@webiny/react-composition";

interface AddToolbarActionProps {
    type?: "heading" | "paragraph";
    element: JSX.Element;
}

export const AddToolbarAction: FC<AddToolbarActionProps> = ({ element, type: targetType }) => {
    const ToolbarPlugin = createComponentPlugin(Toolbar, Original => {
        return function Toolbar({ type, children, anchorElem }) {
            if (!targetType || targetType === type) {
                return (
                    <Original type={type} anchorElem={anchorElem}>
                        {element}
                        {children}
                    </Original>
                );
            }

            return (
                <Original anchorElem={anchorElem} type={type}>
                    {children}
                </Original>
            );
        };
    });

    return <ToolbarPlugin />;
};

// <AddToolbarAction type={"heading"} element={<BoldAction/>}/>
