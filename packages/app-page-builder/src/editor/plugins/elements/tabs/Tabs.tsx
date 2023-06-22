import React from "react";
import { PbEditorElement } from "~/types";
import { isLegacyRenderingEngine } from "~/utils";
import PeTabs from "./PeTabs";
import { Element } from "@webiny/app-page-builder-elements/types";

interface TabsProps {
    element: PbEditorElement;
}

const Tabs: React.FC<TabsProps> = props => {
    if (isLegacyRenderingEngine) {
        return <></>;
    }

    const { element, ...rest } = props;
    return <PeTabs element={element as Element} {...rest} />;
};

export default Tabs;
