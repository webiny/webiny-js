import React from "react";
import { cn, IconButton, buttonVariants } from "@webiny/admin-ui";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import type { FilterDTO } from "~/components/AdvancedSearch/domain/index.js";

interface SelectedFilterProps {
    filter: FilterDTO;
    onEdit: () => void;
    onDelete: () => void;
}

export const SelectedFilter = (props: SelectedFilterProps) => {
    return (
        <div
            role={"button"}
            className={cn(buttonVariants({ variant: "tertiary" }), "gap-xs cursor-pointer")}
            onClick={props.onEdit}
        >
            <span className={"truncate max-w-[256px]"}>{props.filter.name}</span>
            <IconButton icon={<Close />} onClick={props.onDelete} size={"xs"} variant={"ghost"} />
        </div>
    );
};
