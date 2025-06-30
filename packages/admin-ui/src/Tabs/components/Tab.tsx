import React, { useContext, useEffect, useRef } from "react";
import { makeDecoratable, generateId, type VariantProps } from "~/utils";
import { TabsContext } from "./Context";
import { tabListVariants } from "./List";

interface TabProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "content"> {
    value: string;
    trigger: React.ReactNode;
    content: React.ReactNode;
    icon?: React.ReactElement;
    spacing?: VariantProps<typeof tabListVariants>["spacing"];
    disabled?: boolean;
    visible?: boolean;
    "data-testid"?: string;
}

interface TabItem extends TabProps {
    id: string;
}

const DecoratableTab = (props: TabProps) => {
    const tabsContext = useContext(TabsContext);
    const idRef = useRef(generateId());

    useEffect(() => {
        tabsContext!.addTab({ ...props, id: idRef.current, visible: props.visible ?? true });
    }, [props]);

    useEffect(() => {
        return () => {
            return tabsContext!.removeTab(idRef.current);
        };
    }, []);

    return null;
};

const Tab = makeDecoratable("Tab", DecoratableTab);

export { Tab, type TabProps, type TabItem };
