import React, { useCallback } from "react";
import type { CmsModel } from "~/types.js";
import { OptionsModelList } from "~/admin/plugins/fieldRenderers/ref/advanced/components/options/OptionsModelList.js";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as LinkIcon } from "@webiny/icons/link.svg";
import { Button, type ButtonProps, DropdownMenu } from "@webiny/admin-ui";

const CreateNewRecordButton = (props: ButtonProps) => {
    return <Button {...props} variant={"tertiary"} text="Create a new record" icon={<AddIcon />} />;
};

const LinkExistingRecordButton = (props: ButtonProps) => {
    return (
        <Button
            {...props}
            variant={"tertiary"}
            text="Select an existing record"
            icon={<LinkIcon />}
        />
    );
};

interface OptionsProps {
    models: CmsModel[];
    onNewRecord: (modelId: string) => void;
    onLinkExistingRecord: (modelId: string) => void;
}
export const Options = ({ models, onNewRecord, onLinkExistingRecord }: OptionsProps) => {
    const hasMultipleModels = models.length > 1;
    const onSingleNewRecord = useCallback(() => {
        if (models.length === 0 || hasMultipleModels) {
            return;
        }
        onNewRecord(models[0].modelId);
    }, [models]);

    const onSingleExistingRecord = useCallback(() => {
        if (models.length === 0 || hasMultipleModels) {
            return;
        }
        onLinkExistingRecord(models[0].modelId);
    }, [models]);

    if (hasMultipleModels) {
        return (
            <div className={"flex gap-sm"}>
                <DropdownMenu
                    trigger={
                        <Button
                            variant={"tertiary"}
                            text="Create a new record"
                            icon={<AddIcon />}
                        />
                    }
                >
                    <OptionsModelList onClick={onNewRecord} models={models} />
                </DropdownMenu>
                <DropdownMenu
                    trigger={
                        <Button
                            variant={"tertiary"}
                            text="Select an existing record"
                            icon={<LinkIcon />}
                        />
                    }
                >
                    <OptionsModelList onClick={onLinkExistingRecord} models={models} />
                </DropdownMenu>
            </div>
        );
    }

    return (
        <div className={"flex gap-sm"}>
            <CreateNewRecordButton onClick={onSingleNewRecord} />
            <LinkExistingRecordButton onClick={onSingleExistingRecord} />
        </div>
    );
};
