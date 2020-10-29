import { flattenElementsHelper } from "@webiny/app-page-builder/editor/recoil/helpers";
import React, { useEffect } from "react";
import lodashCloneDeep from "lodash/cloneDeep";
import { ConnectedStoreComponent } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { Editor as EditorComponent } from "./components/Editor";
import { EditorProvider } from "./provider";
import { RecoilRoot, RecoilState, useSetRecoilState } from "recoil";
import { RecoilUndoRoot } from "recoil-undo";
import {
    contentAtom,
    ContentAtomType,
    elementsAtom,
    pageAtom,
    PageAtomType
} from "@webiny/app-page-builder/editor/recoil/modules";

type EditorPropsType = {
    page: PageAtomType;
};
type EditorRecoilUndoRoot = {
    trackedAtoms: RecoilState<any>[];
    page: PageAtomType;
};
const EditorRecoilUndoRoot: React.FunctionComponent<EditorRecoilUndoRoot> = props => {
    const { page, ...restOfProps } = props;

    const setPageAtomValue = useSetRecoilState(pageAtom);
    const setElementsAtomValue = useSetRecoilState(elementsAtom);
    const setContentAtomValue = useSetRecoilState(contentAtom);

    useEffect(() => {
        const pageAtomValue = {
            ...page,
            content: undefined
        };
        const contentAtomValue: ContentAtomType = (page as any).content;
        const elementsAtomValue = flattenElementsHelper(lodashCloneDeep(contentAtomValue));
        setPageAtomValue(pageAtomValue);
        setContentAtomValue(contentAtomValue);
        setElementsAtomValue(elementsAtomValue);
    }, []);
    return <RecoilUndoRoot {...restOfProps} />;
};
export const Editor: React.FunctionComponent<EditorPropsType> = ({ page }) => {
    return (
        <RecoilRoot>
            <EditorRecoilUndoRoot page={page} trackedAtoms={[contentAtom]}>
                <ConnectedStoreComponent />
                <EditorProvider>
                    <EditorComponent />
                </EditorProvider>
            </EditorRecoilUndoRoot>
        </RecoilRoot>
    );
};
export { useEventActionHandler } from "./provider";
