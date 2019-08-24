// @flow
import type { Change } from "slate";
import type { I18NInputRichTextEditorPluginType } from "@webiny/app-i18n/types";

const plugin: I18NInputRichTextEditorPluginType = {
    name: "i18n-input-rich-text-editor-scroll",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "scroll",
        editor: {
            onKeyDown(event: SyntheticKeyboardEvent<*>, change: Change, next: Function) {
                const native = window.getSelection();
                if (native.type === "None") {
                    return { top: 0, left: 0, width: 0, height: 0 };
                }

                const range = native.getRangeAt(0);
                const pos = range.getBoundingClientRect();

                const cursorY = pos.top;
                // $FlowFixMe
                const { clientHeight } = document.documentElement;
                const height = clientHeight - 50;

                if (cursorY > height) {
                    const scrollDiff = cursorY - height;
                    window.scrollTo(0, window.scrollY + scrollDiff + 20);
                }

                return next();
            }
        }
    }
};

export default plugin;
