// @flow
import isHotkey from "is-hotkey";
import type { Change } from "slate";

export default () => {
    return {
        editor: [
            {
                name: "form-editor-rich-editor-break",
                type: "form-editor-rich-editor",
                slate: {
                    onKeyDown(e: SyntheticKeyboardEvent<*>, change: Change, next: Function) {
                        if (isHotkey("shift+enter", e)) {
                            return change.splitBlock().setBlocks("paragraph");
                        }
                        return next();
                    }
                }
            }
        ]
    };
};
