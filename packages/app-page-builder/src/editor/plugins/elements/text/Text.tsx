import React, { useMemo } from "react";
import { elementWithChildrenByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import {
    createPropsFromConfig,
    RichTextEditor as UiRichTextEditor
} from "@webiny/ui/RichTextEditor";
import { OutputBlockData } from "@editorjs/editorjs";
import { useRecoilValue } from "recoil";
import { plugins } from "@webiny/plugins";

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

type TextType = {
    elementId: string;
};
const Text: React.FunctionComponent<TextType> = ({ elementId }) => {
    const handler = useEventActionHandler();
    const element = useRecoilValue(elementWithChildrenByIdSelector(elementId));
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
        <ElementRoot element={element} className={className}>
            <UiRichTextEditor onChange={onChange} value={text} {...rteProps} />
        </ElementRoot>
    );
};
export default React.memo(Text);
