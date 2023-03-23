import React from "react";
import { Provider } from "@webiny/app-admin/";
import Snackbar from "./Snackbar";
import { DialogContainer } from "./Dialog";
import { Portal } from "@rmwc/base";

/**
 * Dialogs, Menus and Snackbars require a container to be rendered, and we want to place it outside of
 * any other views that are constructed by developers. We need these 2 containers to always be
 * present, even if there is no <Layout> mounted.
 */

interface OverlaysHocProps {
    children: React.ReactNode;
}
interface OverlaysProps {
    children: React.ReactNode;
}

const OverlaysHOC = (Component: React.VFC<OverlaysHocProps>): React.VFC<OverlaysProps> => {
    return function Overlays({ children }) {
        return (
            <Component>
                {children}
                <div style={{ zIndex: 30, position: "absolute" }}>
                    <Snackbar />
                </div>
                <Portal />
                <DialogContainer />
            </Component>
        );
    };
};

export const Overlays: React.VFC = () => {
    /**
     * TODO @ts-refactor @pavel
     */
    // @ts-ignore
    return <Provider hoc={OverlaysHOC} />;
};
