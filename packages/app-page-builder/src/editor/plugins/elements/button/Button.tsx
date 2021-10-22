import React from "react";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import PeButton from "~/editor/plugins/elements/button/PeButton";

const Button = ({ element }) => {
    const pageElements = usePageElements();

    if (pageElements) {
        return <PeButton element={element} />;
    }

    return <PeButton element={element} />;
};

export default Button;
