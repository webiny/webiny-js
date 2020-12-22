import React from "react";
import { useRecoilValue } from "recoil";
import classNames from "classnames";
import { PbElement } from "../../types";
import { elementWithChildrenByIdSelector, activeElementIdSelector } from "../recoil/modules";
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
    const element: PbElement = useRecoilValue(elementWithChildrenByIdSelector(elementId));
    const activeElementId = useRecoilValue(activeElementIdSelector);
    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: "data.text"
    });

    const onChange = React.useCallback(
        value => {
            getUpdateValue("data.text")(value);
        },
        [getUpdateValue]
    );
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
                disableEditing={activeElementId !== elementId}
            />
        </ElementRoot>
    );
};
export default React.memo(Text);
