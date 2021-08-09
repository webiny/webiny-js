import React from "react";
import { useRecoilValue } from "recoil";
import { PbEditorElement } from "@webiny/app-page-builder/types";
import { elementWithChildrenByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import ElementAnimation from "@webiny/app-page-builder/render/components/ElementAnimation";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import Stepper from "~/render/stepper";

type ElementContainerPropsType = {
    element: PbEditorElement;
};
const ElementContainer: React.FunctionComponent<ElementContainerPropsType> = ({
    element: { id }
}) => {
    const element = useRecoilValue(elementWithChildrenByIdSelector(id));

    // TODO remove when state is fully switched to use content instead of flat elements
    if (!element) {
        return null;
    }
    return (
        <ElementAnimation>
            <ElementRoot element={element}>
                {({ elementAttributes, customClasses, combineClassNames }) => {
                    return (
                        <div
                            id={id}
                            className={combineClassNames(...customClasses)}
                            {...elementAttributes}
                        >
                            <Stepper />
                        </div>
                    );
                }}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default React.memo(ElementContainer, (current, next) => {
    return current.element.id === next.element.id;
});
