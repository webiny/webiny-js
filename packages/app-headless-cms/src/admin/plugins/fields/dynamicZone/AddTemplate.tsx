import React, { useState } from "react";
import type { CmsDynamicZoneTemplate } from "~/types.js";
import { TemplateDialog } from "./TemplateDialog.js";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as AddCircleIcon } from "@webiny/icons/add_circle_outline.svg";
import { Button, Text, IconButton, Link, Tooltip } from "@webiny/admin-ui";

interface AddTemplateProps {
    onTemplate: UseAddTemplateParams["onTemplate"];
}

interface UseAddTemplateParams {
    onTemplate: (template: CmsDynamicZoneTemplate) => void;
}

function useAddTemplate(params: UseAddTemplateParams) {
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);

    const addTemplate = () => {
        setShowTemplateDialog(true);
    };

    const onTemplate = (template: CmsDynamicZoneTemplate) => {
        params.onTemplate(template);
    };

    const onDialogClose = () => {
        setShowTemplateDialog(false);
    };

    return {
        addTemplate,
        onTemplate,
        onDialogClose,
        showTemplateDialog
    };
}

export const AddTemplateButton = (props: AddTemplateProps) => {
    const { addTemplate, onTemplate, showTemplateDialog, onDialogClose } = useAddTemplate({
        onTemplate: props.onTemplate
    });

    return (
        <div
            className={
                "flex flex-col px-xl pt-xl pb-lg gap-sm border-sm border-neutral-muted rounded"
            }
        >
            <div className={"w-full text-center"}>
                {showTemplateDialog ? (
                    <TemplateDialog onTemplate={onTemplate} onClose={onDialogClose} />
                ) : null}
                <Button
                    size={"sm"}
                    variant={"secondary"}
                    onClick={addTemplate}
                    text={"Add template"}
                    icon={<AddIcon />}
                />
            </div>
            <div
                className={
                    "flex items-center justify-center gap-xs w-full mx-auto text-center"
                }
            >
                <Text size={"sm"} className={"text-neutral-strong"}>
                    <Link
                        to={"http://webiny.link/admin/how-to-use/dynamic-zones"}
                        target={"_blank"}
                    >
                        Learn how
                    </Link>{" "}
                    templates and dynamic zones work.
                </Text>
            </div>
        </div>
    );
};

export const AddTemplateIcon = (props: AddTemplateProps) => {
    const { addTemplate, onTemplate, showTemplateDialog, onDialogClose } = useAddTemplate({
        onTemplate: props.onTemplate
    });

    return (
        <div className={"w-full text-center mt-md"}>
            {showTemplateDialog ? (
                <TemplateDialog onTemplate={onTemplate} onClose={onDialogClose} />
            ) : null}
            <Tooltip
                content={"Add template"}
                trigger={
                    <IconButton
                        onClick={addTemplate}
                        icon={<AddCircleIcon />}
                        size={"lg"}
                        variant={"ghost"}
                    />
                }
            />
        </div>
    );
};
