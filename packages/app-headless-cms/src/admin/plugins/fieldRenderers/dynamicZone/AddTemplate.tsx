import React, { useState } from "react";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as AddCircleIcon } from "@webiny/icons/add_circle_outline.svg";
import type { CmsDynamicZoneTemplate, CmsDynamicZoneTemplateWithTypename } from "~/types.js";
import { TemplateGallery } from "./TemplateGallery.js";
import { useTemplateTypename } from "~/admin/plugins/fieldRenderers/dynamicZone/useTemplateTypename.js";
import { Button, cn, IconButton, Link, Text, Tooltip } from "@webiny/admin-ui";

interface UseAddTemplateParams {
    onTemplate: (template: CmsDynamicZoneTemplateWithTypename) => void;
}

function useAddTemplate(params: UseAddTemplateParams) {
    const [showGallery, setShowGallery] = useState(false);
    const { getFullTypename } = useTemplateTypename();

    const browseTemplates = () => {
        setShowGallery(true);
    };

    const onTemplate = (template: CmsDynamicZoneTemplate) => {
        params.onTemplate({ ...template, __typename: getFullTypename(template) });
        onGalleryClose();
    };

    const onGalleryClose = () => {
        setShowGallery(false);
    };

    return {
        showGallery,
        browseTemplates,
        onTemplate,
        onGalleryClose
    };
}

interface AddTemplateProps {
    label?: string;
    onTemplate: UseAddTemplateParams["onTemplate"];
}

export const AddTemplateButton = (props: AddTemplateProps) => {
    const { showGallery, onTemplate, browseTemplates, onGalleryClose } = useAddTemplate({
        onTemplate: props.onTemplate
    });

    return (
        <div
            className={
                "w-full rounded-md border-sm border-neutral-muted p-sm-extra mt-xs mb-md relative"
            }
        >
            {showGallery ? (
                <TemplateGallery onTemplate={onTemplate} onClose={onGalleryClose} />
            ) : (
                <div
                    className={cn([
                        "w-full flex flex-col gap-sm-extra px-xl pt-xl pb-lg bg-neutral-subtle rounded text-center",
                        "hover:bg-neutral-light"
                    ])}
                >
                    <Button
                        size={"sm"}
                        variant={"ghost"}
                        onClick={browseTemplates}
                        text={"Pick a template"}
                        icon={<AddIcon />}
                    />
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
            )}
        </div>
    );
};

export const AddTemplateIcon = (props: AddTemplateProps) => {
    const { showGallery, onTemplate, browseTemplates, onGalleryClose } = useAddTemplate({
        onTemplate: props.onTemplate
    });

    return (
        <div className={"w-full text-center mt-md"}>
            {showGallery ? (
                <TemplateGallery onTemplate={onTemplate} onClose={onGalleryClose} />
            ) : (
                <Tooltip
                    content={"Add template"}
                    trigger={
                        <IconButton
                            onClick={browseTemplates}
                            icon={<AddCircleIcon />}
                            size={"lg"}
                            variant={"ghost"}
                        />
                    }
                />
            )}
        </div>
    );
};
