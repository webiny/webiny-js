import React from "react";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import type { CmsDynamicZoneTemplate, CmsDynamicZoneTemplateWithTypename } from "~/types.js";
import { TemplateGallery } from "./TemplateGallery.js";
import { useTemplateTypename } from "~/admin/plugins/fieldRenderers/dynamicZone/useTemplateTypename.js";
import { Button, Link, Text, Dialog } from "@webiny/admin-ui";

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

            <Text size={"sm"} className={"text-neutral-strong"}>
                Learn how&nbsp;
                <Link to={"https://webiny.link/admin/how-to-use/dynamic-zones"} target={"_blank"}>
                    templates and dynamic zones work.
                </Link>{" "}
            </Text>
        </div>
    );
};
