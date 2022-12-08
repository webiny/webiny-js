import { compose } from '@webiny/react-composition/Context'
import React, { useEffect } from 'react'
import useToolbar from '../../../../../../app-lexical-editor/src/hooks/useToolbar';

export const ColorPickerAction = compose("") => {
  const { addAction } = useToolbar();
  useEffect(() => {
    
  }, [])
  

  return (
    <div>ColorPickerAction</div>
  )
}
