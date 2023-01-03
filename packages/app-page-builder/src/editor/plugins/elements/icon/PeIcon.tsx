import React from "react";
import { createIcon } from "@webiny/app-page-builder-elements/renderers/icon";
import { createRenderer, useRenderer } from "@webiny/app-page-builder-elements";

const Icon = createIcon();

const PeIcon = createRenderer(() => {
    const { getElement } = useRenderer();
    const element = getElement();

    return <Icon element={element} />;
});

export default PeIcon;
