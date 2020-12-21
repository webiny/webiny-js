import React from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import classNames from "classnames";
import { activeElementIdSelector, elementWithChildrenByIdSelector } from "../../../recoil/modules";
import { ElementRoot } from "../../../../render/components/ElementRoot";
import useUpdateHandlers from "../../elementSettings/useUpdateHandlers";
import ReactMediumEditor from "../../../components/MediumEditor";

const headingPreviewStyle = css({
    fontWeight: 600
});

export const headingClassName = classNames(
    "webiny-pb-base-page-element-style webiny-pb-page-element-text",
    headingPreviewStyle
);

const editorClass = css({
    "& .codex-editor .codex-editor__redactor": {
        paddingBottom: "40px !important"
    }
});

const DEFAULT_EDITOR_OPTIONS = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor", "h1", "h2", "h3", "h4", "h5", "h6"]
    }
};

type TextType = {
    elementId: string;
};
const Heading: React.FunctionComponent<TextType> = ({ elementId }) => {
    const element = useRecoilValue(elementWithChildrenByIdSelector(elementId));
    const activeElementId = useRecoilValue(activeElementIdSelector);
    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: "data"
    });

    const onChange = React.useCallback(
        value => {
            getUpdateValue("text.data.text")(value);
        },
        [getUpdateValue]
    );
    // required due to re-rendering when set content atom and still nothing in elements atom
    if (!element) {
        return null;
    }

    const text = element.data.text;

    return (
        <ElementRoot
            element={element}
            className={classNames(headingClassName, {
                [editorClass]: activeElementId === elementId
            })}
        >
            <ReactMediumEditor
                value={text.data.text}
                onChange={onChange}
                options={DEFAULT_EDITOR_OPTIONS}
            />
        </ElementRoot>
    );
};
export default React.memo(Heading);
