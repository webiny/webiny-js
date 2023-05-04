/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_NORMAL, PASTE_COMMAND } from "lexical";
import { useEffect } from "react";

export function PastePlugin(): JSX.Element | null {
    const [editor] = useLexicalComposerContext();
    // @ts-ignore - it's ok that all paths do not return value
    useEffect(() => {
        return editor.registerCommand(
            PASTE_COMMAND,
            (e: ClipboardEvent) => {
                const { clipboardData } = e;
                const allData: string[] = [];
                if (clipboardData && clipboardData.types) {
                    clipboardData.types.forEach(type => {
                        allData.push(type.toUpperCase(), clipboardData.getData(type));
                    });
                }
                return false;
            },
            COMMAND_PRIORITY_NORMAL
        );
    }, [editor]);

    return null;
}
