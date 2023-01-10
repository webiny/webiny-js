import { createComponentPlugin } from "@webiny/react-composition";
import React, { FC } from "react";
import { Toolbar } from "~/components/Toolbar/Toolbar";
interface AddToolbarActionProps {
    type?: "heading" | "paragraph" | string;
    element: JSX.Element;
}

export const AddToolbarAction: FC<AddToolbarActionProps> = ({ element, type: targetType }) => {
    const ToolbarPlugin = React.memo(
        createComponentPlugin(Toolbar, Original => {
            return function Toolbar({ type, children, anchorElem }): JSX.Element {
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
        })
    );

    return <ToolbarPlugin />;
};
