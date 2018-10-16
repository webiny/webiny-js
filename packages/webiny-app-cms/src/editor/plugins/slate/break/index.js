// @flow
import isHotkey from "is-hotkey";
import type { Change } from "slate";

export default () => {
    return {
        editor: [
            {
                name: "cms-slate-editor-break",
                type: "cms-slate-editor",
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
