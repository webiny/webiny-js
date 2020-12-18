import React, { useMemo } from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import classNames from "classnames";
import { OutputBlockData } from "@editorjs/editorjs";
import { plugins } from "@webiny/plugins";
import {
    activeElementIdSelector,
    elementWithChildrenByIdSelector
} from "@webiny/app-page-builder/editor/recoil/modules";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { createPropsFromConfig } from "@webiny/ui/RichTextEditor";
import { RichTextEditor } from "@webiny/app-admin/components/RichTextEditor";

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
    const handler = useEventActionHandler();
    const element = useRecoilValue(elementWithChildrenByIdSelector(elementId));
    const activeElementId = useRecoilValue(activeElementIdSelector);

    const { id } = element || {};
    const onChange = React.useCallback(
        (value: OutputBlockData[]) => {
            handler.trigger(
                new UpdateElementActionEvent({
                    element: {
                        ...element,
                        data: {
                            ...element.data,
                            text: value
                        }
                    }
                })
            );
        },
        [id]
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
