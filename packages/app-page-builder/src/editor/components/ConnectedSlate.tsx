import { SlateEditorProps } from "@webiny/app-page-builder/editor/components/Slate/Slate";
import React from "react";
import Slate from "./Slate";
import { elementByIdSelectorFamily } from "./recoil";
import { useRecoilValue } from "recoil";

type Props = SlateEditorProps & {
    elementId: string;
};
const ConnectedSlate: React.FunctionComponent<Props> = props => {
    const { elementId } = props;
    const element = useRecoilValue(elementByIdSelectorFamily(elementId));
    const value = element?.data?.text;
    const slateProps = {
        ...props,
        value
    };
    return <Slate {...slateProps} />;
};

export default React.memo(ConnectedSlate);
