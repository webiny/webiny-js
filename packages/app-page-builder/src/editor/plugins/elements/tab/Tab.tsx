import React from "react";
import { PbEditorElement } from "~/types";
import { isLegacyRenderingEngine } from "~/utils";
import PeTab from "./PeTab";
import { Element } from "@webiny/app-page-builder-elements/types";

interface TabProps {
    element: PbEditorElement;
}

const Tab: React.FC<TabProps> = props => {
    if (isLegacyRenderingEngine) {
        return <></>;
    }

    const { element, ...rest } = props;
    return <PeTab element={element as Element} {...rest} />;
};

export default Tab;
