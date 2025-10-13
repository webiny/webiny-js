import React from "react";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { DelayedOnChange, Icon, Input } from "@webiny/admin-ui";
import { useNavigateFolder } from "@webiny/app-aco";
import { useDocumentList } from "~/modules/redirects/RedirectsList/useDocumentList.js";
import { useLoadRedirects, useSearchRedirects } from "~/features/redirects/index.js";

export const Search = () => {
    const { vm } = useDocumentList();
    const { searchRedirects } = useSearchRedirects();
    const { loadRedirects } = useLoadRedirects();
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
                    loadRedirects({ folderId: currentFolderId, resetSearch: true });
                    return;
                }

                searchRedirects(searchQuery, currentFolderId);
            }}
        >
            {({ value, onChange }) => (
                <Input
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    forwardEventOnChange={true}
                    placeholder={vm.searchLabel}
                    startIcon={<Icon icon={<SearchIcon />} label="Search" />}
                    size={"md"}
                    variant={"ghost"}
                    className={"w-full"}
                />
            )}
        </DelayedOnChange>
    );
};
