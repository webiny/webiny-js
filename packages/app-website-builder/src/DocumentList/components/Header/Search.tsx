import React from "react";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { DelayedOnChange, Icon, Input } from "@webiny/admin-ui";
import { useSearchPages } from "~/features/pages/index.js";
import { useNavigateFolder } from "@webiny/app-aco";
import { useDocumentList } from "~/DocumentList/useDocumentList.js";

export const Search = () => {
    const { vm } = useDocumentList();
    const { searchPages } = useSearchPages();
    const { currentFolderId } = useNavigateFolder();

    return (
        <DelayedOnChange
            value={vm.searchQuery}
            onChange={value => {
                if (value === vm.searchQuery) {
                    return;
                }
                searchPages(value, currentFolderId);
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
