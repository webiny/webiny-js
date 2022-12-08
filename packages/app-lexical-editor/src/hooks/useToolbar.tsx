import { useContext } from 'react'
import { ToolbarContext } from '../context/ToolbarContext';

function useToolbar(): ToolbarContext {
 return useContext(ToolbarContext);
}

export default useToolbar;