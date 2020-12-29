import React, { useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import get from "lodash/get";
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
const DATA_NAMESPACE = "data.text";

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
    const [uiAtomValue, setUiAtomValue] = useRecoilState(uiAtom);
    const element: PbElement = useRecoilValue(elementWithChildrenByIdSelector(elementId));
    const activeElementId = useRecoilValue(activeElementIdSelector);
    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });

    const onChange = useCallback(
        value => {
            getUpdateValue(DATA_NAMESPACE)(value);
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

    const { data } = element.data.text;
    const tag = get(element, `${DATA_NAMESPACE}.${uiAtomValue.displayMode}.tag`, "div");
    const typography = get(element, `${DATA_NAMESPACE}.${uiAtomValue.displayMode}.typography`);

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
