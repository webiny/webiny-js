import React, { FC } from "react";
import { createComponentPlugin } from "@webiny/react-composition";
import { StaticToolbar } from "~/components/Toolbar/StaticToolbar";
interface AddToolbarActionProps {
    type?: string;
    element: JSX.Element;
}

export const AddStaticToolbarAction: FC<AddToolbarActionProps> = ({
    element,
    type: targetType
}) => {
    const StaticToolbarPlugin = React.memo(
        createComponentPlugin(StaticToolbar, Original => {
            return function StaticToolbar({ type, actionPlugins, children }): JSX.Element {
                if (!targetType || targetType === type) {
                    return (
                        <Original actionPlugins={actionPlugins} type={type}>
                            {element}
                            {children}
                        </Original>
                    );
                }

                return (
                    <Original actionPlugins={actionPlugins} type={type}>
                        {children}
                    </Original>
                );
            };
        })
    );

    return <StaticToolbarPlugin />;
};
