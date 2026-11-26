import React from "react";
import { Heading, Icon, IconButton, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as BackIcon } from "@webiny/icons/arrow_back.svg";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";

export interface EntryFormHeaderLeftProps {
    onBack?: () => void;
    title: string;
    isNewEntry: boolean;
    modelName: string;
    status: string | null;
}

export const EntryFormHeaderLeft = ({
    onBack,
    title,
    isNewEntry,
    modelName,
    status
}: EntryFormHeaderLeftProps) => {
    return (
        <div className={"flex items-center gap-sm"}>
            {onBack ? (
                <IconButton
                    variant={"ghost"}
                    aria-label={"Back"}
                    onClick={onBack}
                    icon={<BackIcon />}
                />
            ) : null}
            <Heading level={5} className={`text-neutral-primary${isNewEntry ? " opacity-50" : ""}`}>
                {title}
            </Heading>
            <Tooltip
                content={`Model: ${modelName}${status ? ` - Status: ${status}` : ""}`}
                trigger={
                    <Icon icon={<InfoIcon />} label={"Info"} size={"sm"} color={"neutral-light"} />
                }
            />
        </div>
    );
};
