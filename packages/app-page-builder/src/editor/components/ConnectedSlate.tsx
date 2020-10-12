import { SlateEditorProps } from "@webiny/app-page-builder/editor/components/Slate/Slate";
import React from "react";
import Slate from "./Slate";
import { elementByIdSelectorFamily } from "../recoil/recoil";
import { useRecoilValue } from "recoil";

type Props = Omit<SlateEditorProps, "value"> & {
    elementId: string;
};
const ConnectedSlate: React.FunctionComponent<Props> = props => {
    const { elementId } = props;
    const element = useRecoilValue(elementByIdSelectorFamily(elementId));
    const value = element?.data?.text;
    return <Slate {...props} value={value} />;
};

export default React.memo(ConnectedSlate);
