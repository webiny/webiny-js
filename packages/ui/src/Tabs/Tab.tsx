import React, { useContext, useEffect, useRef } from "react";
import { TabProps as RmwcTabProps } from "@rmwc/tabs";
import shortid from "shortid";
import { TabsContext } from "./Tabs";

export type TabProps = RmwcTabProps & {
    visible?: boolean;

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
