import React from "react";
import { Separator } from "@webiny/admin-ui";
import { Search } from "@webiny/app-aco";
import { ButtonsCreate } from "./ButtonsCreate";
import { Title } from "./Title";
import { useSearchPages } from "~/controllers/index.js";

interface HeaderProps {
    isRoot: boolean;
    title?: string;
    canCreateFolder: boolean;
    canCreateContent: boolean;
    onCreateDocument: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
}

export const Header = (props: HeaderProps) => {
    const { searchPages, query } = useSearchPages();

    const { title, isRoot, canCreateFolder, canCreateContent, onCreateDocument, onCreateFolder } =
        props;

    return (
        <>
            <div className={"wby-flex wby-flex-col wby-gap-md"}>
                <Title title={title} isRoot={isRoot} />
                <div className={"wby-px-md wby-pb-sm"}>
                    <div className={"wby-flex wby-items-center wby-gap-sm wby-w-full"}>
                        <div className={"wby-flex-1"}>
                            <Search
                                value={query}
                                onChange={searchPages}
                                placeholder={"Search..."}
                            />
                        </div>
                        <div>
                            <div className={"wby-flex wby-gap-sm"}>
                                {"Add button filters"}
                                <ButtonsCreate
                                    canCreateFolder={canCreateFolder}
                                    canCreateContent={canCreateContent}
                                    onCreateFolder={onCreateFolder}
                                    onCreateDocument={onCreateDocument}
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
