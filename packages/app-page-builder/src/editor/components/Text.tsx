import React, { useCallback } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import classNames from "classnames";
import { PbElement } from "../../types";
import {
    elementWithChildrenByIdSelector,
    activeElementIdSelector,
    activateElementMutation,
    uiAtom
} from "../recoil/modules";
import { ElementRoot } from "../../render/components/ElementRoot";
import useUpdateHandlers from "../plugins/elementSettings/useUpdateHandlers";
import ReactMediumEditor from "../components/MediumEditor";

export const textClassName = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

type TextElementProps = {
    elementId: string;
    editorOptions: any;
    rootClassName?: string;
};
const Text: React.FunctionComponent<TextElementProps> = ({
    elementId,
    editorOptions,
    rootClassName
}) => {
    const setUiAtomValue = useSetRecoilState(uiAtom);
    const element: PbElement = useRecoilValue(elementWithChildrenByIdSelector(elementId));
    const activeElementId = useRecoilValue(activeElementIdSelector);
    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: "data.text"
    });

    const onChange = useCallback(
        value => {
            getUpdateValue("data.text")(value);
        },
        [getUpdateValue]
    );
    const onSelect = useCallback(() => {
        // Mark element active on editor element selection
        if (elementId && activeElementId !== elementId) {
            setUiAtomValue(prev => activateElementMutation(prev, elementId));
        }
    }, [activeElementId, elementId]);
    // required due to re-rendering when set content atom and still nothing in elements atom
    if (!element) {
        return null;
    }

    const { typography, data, tag } = element.data.text;

    return (
        <ElementRoot
            element={element}
            className={classNames(textClassName, rootClassName, typography)}
        >
            <ReactMediumEditor
                tag={tag}
                value={data.text}
                onChange={onChange}
                options={editorOptions}
                onSelect={onSelect}
            />
        </ElementRoot>
    );
};
export default React.memo(Text);
