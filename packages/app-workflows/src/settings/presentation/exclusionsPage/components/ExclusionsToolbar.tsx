import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { SegmentedControl } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import type { ExclusionTab } from "~/settings/model/list/ExclusionTab.js";
import type { ExclusionTabVm } from "../abstractions.js";
import type { ExclusionsPagePresenter } from "../abstractions.js";
import { EXCLUSIONS_SEARCH_LABEL } from "../exclusionsCopy.js";

export interface ExclusionsToolbarProps {
    tab: ExclusionTab;
    tabs: ExclusionTabVm[];
    search: string;
    presenter: ExclusionsPagePresenter.Interface;
}

interface ExclusionsTabItem {
    label: string;
    value: string;
}

/*
 * Search by name (no visible label; it filters the loaded rows on the client) and the Active /
 * Expired / All tabs (R322). Both only forward to the presenter.
 */
export const ExclusionsToolbar = ({ tab, tabs, search, presenter }: ExclusionsToolbarProps) => {
    const items: ExclusionsTabItem[] = tabs.map(item => {
        return { label: item.label, value: item.id };
    });

    const onTabChange = (value: string) => {
        const picked = tabs.find(item => item.id === value);
        if (picked) {
            presenter.setTab(picked.id);
        }
    };

    return (
        <div data-testid="exclusions-toolbar" className="flex flex-wrap items-center gap-md">
            <div data-role="name-search" className="w-2xs shrink-0">
                <Input
                    aria-label={EXCLUSIONS_SEARCH_LABEL}
                    placeholder={EXCLUSIONS_SEARCH_LABEL}
                    value={search}
                    onChange={value => presenter.setSearch(value)}
                    startIcon={<Icon icon={<SearchIcon />} label={""} size={"sm"} />}
                />
            </div>
            <div className="shrink-0">
                <SegmentedControl items={items} value={tab} onChange={onTabChange} />
            </div>
        </div>
    );
};
