import React from "react";
import { ReactComponent as BackIcon } from "@webiny/icons/arrow_back.svg";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";
import { useNavigateFolder } from "@webiny/app-aco";
import { makeDecoratable } from "@webiny/react-composition";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/index.js";
import { cn, Heading, Icon, IconButton, Tooltip } from "@webiny/admin-ui";

export const ContentEntryFormMeta = makeDecoratable("ContentEntryFormMeta", () => {
    const { entry, contentModel } = useContentEntry();
    const status = entry.meta?.status ?? null;

    return (
        <Tooltip
            content={`Model: ${contentModel.name} ${status ? `- Status: ${status}` : ""}`}
            trigger={
                <Icon icon={<InfoIcon />} label={"Info"} size={"sm"} color={"neutral-light"} />
            }
        />
    );
});

export const ContentEntryFormTitle = makeDecoratable("ContentEntryFormTitle", () => {
    const { entry, contentModel } = useContentEntry();

    const title = entry?.meta?.title || `New ${contentModel.name}`;
    const isNewEntry = !entry.meta?.title;

    return (
        <Heading
            level={5}
            className={cn("text-neutral-primary max-w-lg truncate", {
                "opacity-50": isNewEntry
            })}
        >
            {title}
        </Heading>
    );
});

export const FullScreenContentEntryHeaderLeft = () => {
    const { navigateToFolder, currentFolderId } = useNavigateFolder();

    return (
        <div className={"flex items-center gap-sm"}>
            <IconButton
                variant={"ghost"}
                onClick={() => navigateToFolder(currentFolderId)}
                icon={<BackIcon />}
            />
            <ContentEntryFormTitle />
            <ContentEntryFormMeta />
        </div>
    );
};
