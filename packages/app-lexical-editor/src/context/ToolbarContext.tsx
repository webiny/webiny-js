import React, {createContext, useState } from "react";


export type ToolbarActionValue = boolean | string | null | undefined | number;
export type ToolbarActionItem = { name: string, value: ToolbarActionValue  };

export interface ToolbarActionsData {
  [tooblarActionItem: string] : ToolbarActionValue;
}

export interface ToolbarContext {
  actions: ToolbarActionsData;
  addAction: (action: ToolbarActionItem) => void;
  updateAction: (action: ToolbarActionItem) => void;
}

export const ToolbarContext = createContext<ToolbarContext>({
  actions: { isBold: false} as ToolbarActionsData,
  addAction: () => {
    return void 0;
  },
  updateAction: () => {
    return void 0;
  }
});

export const LexicalToolbarProvider = (Component: React.FC): React.FC => {
  return function ToolbarProvider({ children, ...props }) {
      const [actions, setActions] = useState({} as ToolbarActionsData);

      const addAction = ({ name, value }: ToolbarActionItem) => {
        if(!name){
          return;
        }
        setActions({ ...actions, [name]: value });
      }

      const updateAction = ({ name, value }: ToolbarActionItem) => {
        if(!name){
          return;
        }
        setActions({ ...actions, [name]: value });
      }
  
      return (
        <ToolbarContext.Provider value={{
          actions,
          addAction,
          updateAction
        }}>
          <Component>{children}</Component>
        </ToolbarContext.Provider>
      );
    };
};

