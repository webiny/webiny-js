import React, { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getSelection,
    $isNodeSelection,
    $isRangeSelection,
    $isRootOrShadowRoot,
    COMMAND_PRIORITY_CRITICAL,
    LexicalCommand,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import { Compose, makeComposable } from "@webiny/react-composition";
import { TypographyActionContext } from "~/context/TypographyActionContext";

import { TypographyValue } from "~/types";
import {
    $isTypographyElementNode,
    ADD_TYPOGRAPHY_ELEMENT_COMMAND,
    TypographyElementNode,
    TypographyPayload
} from "~/nodes/TypographyElementNode";
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import { getSelectedNode } from "~/utils/getSelectedNode";
import { ListNode } from "@lexical/list";
import { useLexicalEditor } from "@lexical/react/DEPRECATED_useLexicalEditor";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";

/*
 * Base composable action component that is mounted on toolbar action as a placeholder for the custom toolbar action.
 * Note: Toa add custom component access trough @see LexicalEditorConfig API
 * */
export const BaseTypographyActionDropDown = makeComposable(
    "BaseTypographyActionDropDown",
    (): JSX.Element | null => {
        useEffect(() => {
            console.log("Default BaseTypographyActionDropDown, please add your own component");
        }, []);
        return null;
    }
);

interface TypographyActionDropdownProps {
    element: JSX.Element;
}

const TypographyActionDropDown: React.FC<TypographyActionDropdownProps> = ({
    element
}): JSX.Element => {
    return <Compose component={BaseTypographyActionDropDown} with={() => () => element} />;
};

export interface TypographyAction extends React.FC<unknown> {
    TypographyDropDown: typeof TypographyActionDropDown;
}

export const TypographyAction: TypographyAction = () => {
    const [editor] = useLexicalComposerContext();
    const [activeEditor, setActiveEditor] = useState(editor);
    const [typography, setTypography] = useState<TypographyValue>();

    const setTypographySelect = useCallback(
        (value: TypographyValue) => {
            setTypography(value);
        },
        [typography]
    );

    const onTypographySelect = useCallback((value: TypographyValue) => {
        setTypographySelect(value);
        editor.dispatchCommand<LexicalCommand<TypographyPayload>>(ADD_TYPOGRAPHY_ELEMENT_COMMAND, {
            value
        });
    }, []);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            let element =
                anchorNode.getKey() === "root"
                    ? anchorNode
                    : $findMatchingParent(anchorNode, e => {
                          const parent = e.getParent();
                          return parent !== null && $isRootOrShadowRoot(parent);
                      });

            if (element === null) {
                element = anchorNode.getTopLevelElementOrThrow();
            }

            // Update links
            const node = getSelectedNode(selection);
            const parent = node.getParent();

            if ($isTypographyElementNode(parent)) {
                const el = element as TypographyElementNode;
                setTypography(el.getTypographyValue());
            }
        }
    }, [activeEditor]);

    useEffect(() => {
        return mergeRegister(
            activeEditor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            })
        );
    }, [activeEditor, editor, updateToolbar]);

    useEffect(() => {
        return editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            (_payload, newEditor) => {
                updateToolbar();
                setActiveEditor(newEditor);
                return false;
            },
            COMMAND_PRIORITY_CRITICAL
        );
    }, [editor, updateToolbar]);

    return (
        <TypographyActionContext.Provider
            value={{
                value: typography,
                applyTypography: onTypographySelect
            }}
        >
            <BaseTypographyActionDropDown />
        </TypographyActionContext.Provider>
    );
};

{
    /* Color action settings */
}
TypographyAction.TypographyDropDown = TypographyActionDropDown;
