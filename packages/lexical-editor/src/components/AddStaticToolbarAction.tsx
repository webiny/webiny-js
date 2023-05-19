import React, { FC } from "react";
import { createComponentPlugin } from "@webiny/react-composition";
import { Toolbar } from "~/components/Toolbar/Toolbar";
import {StaticToolbar} from "~/components/Toolbar/StaticToolbar";
interface AddToolbarActionProps {
    type?: "rich-text-static-toolbar" | string;
    element: JSX.Element;
}

export const AddStaticToolbarAction: FC<AddToolbarActionProps> = ({ element, type: targetType }) => {
    const StaticToolbarPlugin = React.memo(
        createComponentPlugin(StaticToolbar, Original => {
            return function StaticToolbar({ type, children }): JSX.Element {
                if (!targetType || targetType === type) {
                    return (
                        <Original type={type}>
                            {element}
                            {children}
                        </Original>
                    );
                }

                return (
                    <Original type={type}>
                        {children}
                    </Original>
                );
            };
        })
    );

    return <StaticToolbarPlugin />;
};
