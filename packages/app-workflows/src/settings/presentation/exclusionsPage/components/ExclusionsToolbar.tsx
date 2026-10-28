import React from "react";
import { SegmentedControl } from "@webiny/admin-ui";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import type { ExclusionTab } from "~/settings/model/list/ExclusionTab.js";
import type { ExclusionFilterVm } from "../abstractions.js";
import type { ExclusionTabVm } from "../abstractions.js";
import type { ExclusionsPagePresenter } from "../abstractions.js";
import { EXCLUSIONS_FILTER_ANY_LABEL } from "../exclusionsCopy.js";
import { EXCLUSIONS_FILTER_LABEL } from "../exclusionsCopy.js";

export interface ExclusionsToolbarProps {
    tab: ExclusionTab;
    tabs: ExclusionTabVm[];
    filter: ExclusionFilterVm;
    presenter: ExclusionsPagePresenter.Interface;
}

interface ExclusionsTabItem {
    label: string;
    value: string;
}

/*
 * The user filter (the users in the list, searched on the client, R332) and the Active / Expired /
 * All tabs (R322). Both only forward to the presenter.
 */
export const ExclusionsToolbar = ({ tab, tabs, filter, presenter }: ExclusionsToolbarProps) => {
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
        <div data-testid="exclusions-toolbar" className="flex flex-wrap items-end gap-md">
            <div className="grow">
                <WorkflowPicker
                    label={EXCLUSIONS_FILTER_LABEL}
                    placeholder={EXCLUSIONS_FILTER_ANY_LABEL}
                    anyLabel={EXCLUSIONS_FILTER_ANY_LABEL}
                    icon={"person"}
                    value={filter.value}
                    selected={filter.selected}
                    options={filter.options}
                    disabled={false}
                    error={null}
                    onSearch={search => presenter.searchUserFilter(search)}
                    onChange={id => presenter.setUserFilter(id)}
                />
            </div>
            <div className="shrink-0">
                <SegmentedControl items={items} value={tab} onChange={onTabChange} />
            </div>
        </div>
    );
};
