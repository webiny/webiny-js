import React, { useMemo } from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import classNames from "classnames";
import { OutputBlockData } from "@editorjs/editorjs";
import { plugins } from "@webiny/plugins";
import { createPropsFromConfig } from "@webiny/ui/RichTextEditor";
import { RichTextEditor } from "@webiny/app-admin/components/RichTextEditor";
import { activeElementIdSelector, elementWithChildrenByIdSelector } from "../../../recoil/modules";
import { ElementRoot } from "../../../../render/components/ElementRoot";
import useUpdateHandlers from "../../elementSettings/useUpdateHandlers";

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

const editorClass = css({
    "& .codex-editor .codex-editor__redactor": {
        paddingBottom: "40px !important"
    }
});

type TextType = {
    elementId: string;
};
const Text: React.FunctionComponent<TextType> = ({ elementId }) => {
    const element = useRecoilValue(elementWithChildrenByIdSelector(elementId));
    const activeElementId = useRecoilValue(activeElementIdSelector);
    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: "data"
    });

    const onChange = React.useCallback(
        (value: OutputBlockData[]) => {
            getUpdateValue("text")(value);
        },
        [getUpdateValue]
    );
    const rteProps = useMemo(() => {
        return createPropsFromConfig(plugins.byType("pb-rte-config").map(pl => pl.config));
    }, []);
    // required due to re-rendering when set content atom and still nothing in elements atom
    if (!element) {
        return null;
    }

    const text = Array.isArray(element.data.text) ? element.data.text : [];
    return (
        <ElementRoot
            element={element}
            className={classNames(className, {
                [editorClass]: activeElementId === elementId
            })}
        >
            <RichTextEditor onChange={onChange} value={text} {...rteProps} />
        </ElementRoot>
    );
};
export default React.memo(Text);
