// @flow
import isHotkey from "is-hotkey";
import type { Change } from "slate";

export default () => {
    return {
        editor: [
            {
                name: "pb-editor-slate-editor-break",
                type: "pb-editor-slate-editor",
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
