import React from "react";
import { Accordion } from "@webiny/admin-ui";
import { useActiveElement } from "~/BaseEditor/hooks/useActiveElement";
import { DocumentElement } from "~/sdk/types";
import { Background } from "./Groups/Background";
import { MarginPadding } from "./Groups/MarginPadding";

export const StyleProperties = () => {
    const [element] = useActiveElement();
    if (!element) {
        return null;
    }

    return <ElementStyleProperties element={element} />;
};

const ElementStyleProperties = ({ element }: { element: DocumentElement }) => {
    return (
        <Accordion>
            <Background elementId={element.id} />
            <MarginPadding elementId={element.id} />
        </Accordion>
    );
};
