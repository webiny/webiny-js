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
    const { bind } = props;

    const [dialog, setDialog] = useState<boolean>(false);

    const onNewRecord = () => {
        setDialog(true);
        return false;
    };
    const onExistingRecord = () => {
        setDialog(true);
        return false;
    };

    const ref = useReference({
        value: bind.value
    });

    const { entry } = ref;

    return (
        <>
            <Entry entry={entry} />
            <Options onNewRecord={onNewRecord} onLinkExistingRecord={onExistingRecord} />
            {dialog && <Dialog {...props} />}
        </>
    );
};
