import React from "react";
import { DelayedOnChange } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { ToggleGroup } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as GridIcon } from "@webiny/icons/grid_view.svg";
import { ReactComponent as ListIcon } from "@webiny/icons/list.svg";
import type { ViewMode } from "./types.js";

interface TemplateGalleryToolbarProps {
    search: string;
    onSearch: (search: string) => void;
    viewMode: ViewMode;
    onViewMode: (viewMode: ViewMode) => void;
}

export const TemplateGalleryToolbar = ({
    search,
    onSearch,
    viewMode,
    onViewMode
}: TemplateGalleryToolbarProps) => {
    return (
        <div className={"flex items-center gap-sm pb-md pt-xs"}>
            <div className={"flex-1 min-w-0"}>
                <DelayedOnChange value={search} onChange={onSearch}>
                    {({ value, onChange }) => (
                        <Input
                            autoFocus={true}
                            value={value}
                            onChange={onChange}
                            placeholder={"Search templates..."}
                            startIcon={<Icon icon={<SearchIcon />} label={"Search"} />}
                            size={"md"}
                            variant={"primary"}
                        />
                    )}
                </DelayedOnChange>
            </div>
            <div className={"shrink-0"}>
                <ToggleGroup
                    type="single"
                    value={viewMode}
                    onChange={value => onViewMode(value as ViewMode)}
                    items={[
                        { id: "grid", value: "grid", icon: <GridIcon /> },
                        { id: "list", value: "list", icon: <ListIcon /> }
                    ]}
                    variant="ghost"
                />
            </div>
        </div>
    );
};
