import React from "react";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { DelayedOnChange, Icon, Input } from "@webiny/admin-ui";
import { useLoadPages, useSearchPages } from "~/features/pages/index.js";
import { useNavigateFolder } from "@webiny/app-aco";
import { useDocumentList } from "~/DocumentList/useDocumentList.js";

export const Search = () => {
    const { vm } = useDocumentList();
    const { searchPages } = useSearchPages();
    const { loadPages } = useLoadPages();
    const { currentFolderId } = useNavigateFolder();

    return (
        <DelayedOnChange
            value={vm.searchQuery}
            onChange={value => {
                const searchQuery = value.trim();

                if (searchQuery === vm.searchQuery) {
                    return;
                }

                if (!searchQuery) {
                    loadPages({ folderId: currentFolderId });
                    return;
                }

                searchPages(searchQuery, currentFolderId);
            }}
        >
            {({ value, onChange }) => (
                <Input
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    forwardEventOnChange={true}
                    placeholder={"Search..."}
                    startIcon={<Icon icon={<SearchIcon />} label="Search" />}
                    size={"md"}
                    variant={"ghost"}
                    className={"wby-w-full"}
                />
            )}
        </DelayedOnChange>
    );
};
