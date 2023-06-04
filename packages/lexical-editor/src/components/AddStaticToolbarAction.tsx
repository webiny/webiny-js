import React, { FC } from "react";
import { createComponentPlugin } from "@webiny/react-composition";
import { StaticToolbar } from "~/components/Toolbar/StaticToolbar";
interface AddToolbarActionProps {
    type?: "rich-text-static-toolbar" | string;
    element: JSX.Element;
}

export const AddStaticToolbarAction: FC<AddToolbarActionProps> = ({ element }) => {
    const StaticToolbarPlugin = React.memo(
        createComponentPlugin(StaticToolbar, Original => {
            return function StaticToolbar({ actionPlugins, children }): JSX.Element {
                return (
                    <Original actionPlugins={actionPlugins}>
                        {element}
                        {children}
                    </Original>
                );
            };
        })
    );

    return <StaticToolbarPlugin />;
};
