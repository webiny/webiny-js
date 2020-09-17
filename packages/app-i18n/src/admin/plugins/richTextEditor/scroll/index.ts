import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

type OnKeyDownEvent = {
    event: any;
};

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-input-rich-text-editor-scroll",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "scroll",
        editor: {
            onKeyDown(_ev: OnKeyDownEvent, next: () => void) {
                const native = window.getSelection();
                if (native.type === "None") {
                    return { top: 0, left: 0, width: 0, height: 0 };
                }

                const range = native.getRangeAt(0);
                const pos = range.getBoundingClientRect();

                const cursorY = pos.top;
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
