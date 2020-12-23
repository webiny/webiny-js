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
    useCustomTag?: boolean;
};
const Text: React.FunctionComponent<TextElementProps> = ({
    elementId,
    editorOptions,
    rootClassName,
    useCustomTag
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
    const onEdit = useCallback(() => {
        // Mark element active on editor change
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
                tag={useCustomTag ? tag : "div"}
                value={data.text}
                onChange={onChange}
                options={editorOptions}
                onEdit={onEdit}
            />
        </ElementRoot>
    );
};
export default React.memo(Text);
