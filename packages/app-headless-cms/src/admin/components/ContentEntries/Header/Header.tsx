import React from "react";
import { Separator } from "@webiny/admin-ui";
import { Search } from "@webiny/app-aco";
import { ButtonFilters } from "./ButtonFilters/index.js";
import { ButtonsCreate } from "./ButtonsCreate/index.js";
import { Title } from "./Title/index.js";

interface HeaderProps {
    isRoot: boolean;
    title?: string;
    canCreateFolder: boolean;
    canCreateContent: boolean;
    onCreateEntry: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
}

export const Header = (props: HeaderProps) => {
    const {
        canCreateFolder,
        canCreateContent,
        onCreateEntry,
        onCreateFolder,
        title,
        searchValue,
        onSearchChange
    } = props;

    return (
        <>
            <div className={"flex flex-col gap-md"}>
                <Title title={title} isRoot={props.isRoot} />
                <div className={"px-md pb-sm"}>
                    <div className={"flex items-center gap-sm w-full"}>
                        <div className={"flex-1"}>
                            <Search
                                value={searchValue}
                                onChange={onSearchChange}
                                placeholder={"Search..."}
                            />
                        </div>
                        <div>
                            <div className={"flex gap-sm"}>
                                <ButtonFilters />
                                <ButtonsCreate
                                    canCreateFolder={canCreateFolder}
                                    canCreateContent={canCreateContent}
                                    onCreateFolder={onCreateFolder}
                                    onCreateEntry={onCreateEntry}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Separator />
        </>
    );
};
