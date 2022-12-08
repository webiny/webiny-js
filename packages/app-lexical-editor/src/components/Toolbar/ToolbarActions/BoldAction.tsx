import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND, LexicalEditor } from 'lexical'
import React, { FC, useEffect } from 'react'
import useToolbar from '~/hooks/useToolbar';
import { ToolbarAction } from '../../../context/ToolbarContext';

interface BoldActionProps {
    editor: LexicalEditor,
}

type BoldAction = {
 name: string;
 value: boolean;
};

export const BOLD_TEXT_ACTION_VALUE = "isBold";

/**
 * Toolbar action. On toolbar you can see as button that is bold.
 */
export const BoldAction: FC<BoldActionProps> = () => {
  const { addAction, updateAction, actions } = useToolbar();
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    addAction({ name: BOLD_TEXT_ACTION_VALUE, value: false });
  }, [])
  
 useEffect(() => {
   updateAction({ name: BOLD_TEXT_ACTION_VALUE,  })
 }, [editor])
 

  return (
    <button
        onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        className={"popup-item spaced " + (actions[BOLD_TEXT_ACTION_VALUE] ? "active" : "")}
        aria-label="Format text as bold"
    >
        <i className="format bold" />
    </button>
  )
}
