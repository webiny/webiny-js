import React from "react";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import type { CmsDynamicZoneTemplate, CmsDynamicZoneTemplateWithTypename } from "~/types.js";
import { TemplateGallery } from "./TemplateGallery.js";
import { useTemplateTypename } from "~/admin/plugins/fieldRenderers/dynamicZone/useTemplateTypename.js";
import { Button, Dialog } from "@webiny/admin-ui";

interface UseAddTemplateParams {
    onTemplate: (template: CmsDynamicZoneTemplateWithTypename) => void;
}

interface AddTemplateProps {
    label?: string;
    onTemplate: UseAddTemplateParams["onTemplate"];
}

export const AddTemplateButton = (props: AddTemplateProps) => {
    const { getFullTypename } = useTemplateTypename();

    const onTemplate = (template: CmsDynamicZoneTemplate) => {
        props.onTemplate({ ...template, __typename: getFullTypename(template) });
    };

    return (
        <div className={"flex justify-between items-center"}>
            <Dialog
                size={"lg"}
                className={"w-[800px]"}
                trigger={
                    <Button
                        size={"sm"}
                        variant={"tertiary"}
                        text={"Add a template"}
                        icon={<AddIcon />}
                    />
                }
                title="Insert a template"
                info={<></>}
            >
                <TemplateGallery onTemplate={onTemplate} onClose={() => {}} />
            </Dialog>
        </div>
    );
};
