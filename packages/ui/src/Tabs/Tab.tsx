import React, { useContext, useEffect, useRef } from "react";
import shortid from "shortid";
import { TabsContext } from "./Tabs";

export type TabProps = {
    /**
     * A label for the tab.
     */
    label?: any;
    /**
     * The label for the tab, passed as children.
     */
    children?: React.ReactNode;
    /**
     * The icon to use for the tab.
     */
    icon?: React.ReactNode;
    /**
     * Is tab visible?
     */
    visible?: boolean;
    /**
     * @deprecated
     */
    tag?: string;
    /**
     * Is tab disabled?
     */
    disabled?: boolean;
    /**
     * Style object
     */
    style?: React.CSSProperties;
    /**
     * Tab ID for the testing.
     */
    "data-testid"?: string;
};

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please find out the new `<Tabs />` component props from the `@webiny/admin-ui` package instead.
 */
export const Tab = React.memo((props: TabProps) => {
    const tabsContext = useContext(TabsContext);
    const idRef = useRef(shortid.generate());

    useEffect(() => {
        tabsContext!.addTab({ ...props, id: idRef.current, visible: props.visible ?? true });
    }, [props]);

    useEffect(() => {
        return () => {
            return tabsContext!.removeTab(idRef.current);
        };
    }, []);

    return null;
});

Tab.displayName = "Tab";
