import React, { useState } from "react";
import { BindComponentRenderProp, CmsEditorFieldRendererProps } from "~/types";
import { Dialog } from "~/admin/components/Dialog";
import { Options } from "./Options";
import { useReference } from "./useReference";
import { Entry } from "./Entry";

interface Props extends CmsEditorFieldRendererProps {
    bind: BindComponentRenderProp;
}
export const AdvancedReferenceField: React.FC<Props> = props => {
    const { field, contentModel, getBind, bind } = props;

    const [dialog, setDialog] = useState<boolean>(false);

    const onNewRecord = () => {};
    const onExistingRecord = () => {};

    const ref = useReference({
        value: bind.value
    });

    console.log(ref);
    const { loading, entry, error } = ref;

    return (
        <>
            <Entry entry={entry} />
            <Options onNewRecord={onNewRecord} onLinkExistingRecord={onExistingRecord} />
            {dialog && <Dialog {...props} />}
        </>
    );
};
