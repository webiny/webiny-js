import React from "react";
import { useRecoilValue } from "recoil";
import { editorUiAtom } from "./components/Editor/recoil";

const EditorContext = React.createContext({} as any);
const EditorProvider: React.FunctionComponent = props => {
    const provider = {
        state: {
            bar: {
                isDragging: () => {
                    const { isDragging } = useRecoilValue(editorUiAtom);
                    return isDragging;
                }
            }
        }
    };
    return <EditorContext.Provider value={provider} {...props} />;
};
const useEditor = () => React.useContext(EditorContext);

export { EditorProvider, useEditor };
