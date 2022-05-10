import React from "react";
import { get } from "dot-prop-immutable";
import { ElementRoot } from "../../../components/ElementRoot";
import { PbElement } from "~/types";
import { usePageBuilder } from "~/hooks/usePageBuilder";

interface IFrameProps {
    element: PbElement;
}

const IFrame: React.FC<IFrameProps> = ({ element }) => {
    const {
        responsiveDisplayMode: { displayMode }
    } = usePageBuilder();

    const elementHeight = element.data?.settings?.height?.[displayMode]?.value || "380px";

    return (
        <ElementRoot
            element={element}
            className={"webiny-pb-base-page-element-style webiny-pb-page-element-iframe"}
        >
            <iframe
                style={{ height: elementHeight, width: "100%" }}
                id={element.id}
                src={get(element, "data.iframe.url") || ""}
            />
        </ElementRoot>
    );
};

export default IFrame;
