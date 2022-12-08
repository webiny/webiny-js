import React from 'react'
import { compose } from '@webiny/react-composition';
import useToolbar from '../../../../../app-lexical-editor/src/hooks/useToolbar';
import ColorPicker from '../ColorPicker/ColorPicker';

export const LexicalColorPicker = compose(UIlement) => {
    const { actions, updateToolbarAction } = useToolbar();
  return (
    <>
        <ColorPicker
            position={}  
            value={actions[COLOR_TEXT_ACTION]}
            onChangeComplete={(hex) => updateToolbarAction({ name: COLOR_TEXT_ACTION, value: hex })} />
    </>
  )
}
