import React, { useEffect } from "react";
import lodashCloneDeep from "lodash/cloneDeep";
import { flattenElementsHelper } from "@webiny/app-page-builder/editor/recoil/helpers";
import { ConnectedStoreComponent } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { Editor as EditorComponent } from "./components/Editor";
import { EditorProvider } from "./provider";
import { RecoilRoot, RecoilState, useSetRecoilState } from "recoil";
import { RecoilUndoRoot, useRecoilHistory } from "recoil-undo";
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
    const { startTrackingHistory, stopTrackingHistory } = useRecoilHistory();
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
        stopTrackingHistory();
        setPageAtomValue(pageAtomValue);
        setContentAtomValue(contentAtomValue);
        setElementsAtomValue(elementsAtomValue);
        startTrackingHistory();
    }, []);
    return <RecoilUndoRoot manualHistory={true} {...restOfProps} />;
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
