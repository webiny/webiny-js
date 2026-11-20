import React from "react";
import { Button } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { SegmentedControl } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import type { ExclusionTab } from "~/settings/model/list/ExclusionTab.js";
import type { ExclusionTabVm } from "../abstractions.js";
import type { ExclusionsPagePresenter } from "../abstractions.js";
import { EXCLUSIONS_ADD_LABEL } from "../exclusionsCopy.js";
import { EXCLUSIONS_SEARCH_LABEL } from "../exclusionsCopy.js";

export interface ExclusionsToolbarProps {
    tab: ExclusionTab;
    tabs: ExclusionTabVm[];
    search: string;
    canAdd: boolean;
    presenter: ExclusionsPagePresenter.Interface;
}

interface ExclusionsTabItem {
    label: string;
    value: string;
}

/*
 * Search by name (no visible label; it filters the loaded rows on the client) with Add exclusion at
 * the right of the same row, and the Active / Expired / All tabs on a row of their own (R322,
 * R329). Search and tabs only forward to the presenter; Add exclusion shows once a list is loaded.
 */
export const ExclusionsToolbar = ({
    tab,
    tabs,
    search,
    canAdd,
    presenter
}: ExclusionsToolbarProps) => {
    const items: ExclusionsTabItem[] = tabs.map(item => {
        return { label: item.label, value: item.id };
    });

    const onTabChange = (value: string) => {
        const picked = tabs.find(item => item.id === value);
        if (picked) {
            presenter.setTab(picked.id);
        }
    };

    let add: React.ReactNode = null;
    if (canAdd) {
        add = (
            <Button
                variant="primary"
                text={EXCLUSIONS_ADD_LABEL}
                icon={<AddIcon />}
                size="sm"
                onClick={() => presenter.openAdd()}
            />
        );
    }

    return (
        <div data-testid="exclusions-toolbar" className="flex flex-col gap-sm">
            <div className="flex items-center gap-sm">
                <div data-role="name-search" className="flex-1">
                    <Input
                        aria-label={EXCLUSIONS_SEARCH_LABEL}
                        placeholder={EXCLUSIONS_SEARCH_LABEL}
                        value={search}
                        onChange={value => presenter.setSearch(value)}
                        size="md"
                        variant="ghost"
                        startIcon={<Icon icon={<SearchIcon />} label={""} size={"sm"} />}
                    />
                </div>
                {add}
            </div>
            <Separator />
            <div className="shrink-0">
                <SegmentedControl items={items} value={tab} onChange={onTabChange} />
            </div>
        </div>
    );
};
