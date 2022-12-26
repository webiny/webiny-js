import React, {useCallback, useEffect, useState} from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $isListNode,
    INSERT_ORDERED_LIST_COMMAND, ListNode,
    REMOVE_LIST_COMMAND
} from '@lexical/list';
import {
    $getSelection,
    $isRangeSelection,
    $isRootOrShadowRoot,
    COMMAND_PRIORITY_CRITICAL,
    SELECTION_CHANGE_COMMAND
} from "lexical";
import {$findMatchingParent, $getNearestNodeOfType, mergeRegister} from "@lexical/utils";


/**
 * Toolbar button action. On click will wrap the content in numbered list style.
 */
export const NumberedListAction = () => {
    const [editor] = useLexicalComposerContext();
    const [activeEditor, setActiveEditor] = useState(editor);
    const [isActive, setIsActive] = useState<boolean>(false);


    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            let element =
                anchorNode.getKey() === 'root'
                    ? anchorNode
                    : $findMatchingParent(anchorNode, (e) => {
                        const parent = e.getParent();
                        return parent !== null && $isRootOrShadowRoot(parent);
                    });

            if (element === null) {
                element = anchorNode.getTopLevelElementOrThrow();
            }

            if ($isListNode(element)) {
                const parentList = $getNearestNodeOfType<ListNode>(
                    anchorNode,
                    ListNode,
                );
                // get the type of the list that is selected with the cursor
                const type = parentList
                    ? parentList.getListType()
                    : element.getListType();
                // set the button as active for numbered list
                if(type === "number") {
                    setIsActive(true);
                }else {
                    setIsActive(false);
                }
            }
        }
    }, [activeEditor]);


    useEffect(() => {
        return mergeRegister(
            activeEditor.registerUpdateListener(({editorState}) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }));
    },[activeEditor, editor, updateToolbar]);

    useEffect(() => {
        return editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            (_payload, newEditor) => {
                updateToolbar();
                setActiveEditor(newEditor);
                return false;
            },
            COMMAND_PRIORITY_CRITICAL,
        );
    }, [editor, updateToolbar]);

    const formatNumberedList = () => {
        if(!isActive) {
            // will update the active state in the useEffect
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            // removing will not update correctly the active state, so we need to set to false manually.
            setIsActive(false);
        }
    };

    return (
        <button
            onClick={() => formatNumberedList()}
            className={"popup-item spaced " + (isActive ? "active" : "")}
            aria-label="Format text as bold"
        >
            <i className="icon numbered-list" />
        </button>
    );
};
