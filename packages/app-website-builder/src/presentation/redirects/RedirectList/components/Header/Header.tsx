import React from "react";
import { Separator } from "@webiny/admin-ui";
import { ButtonFilters } from "./ButtonFilters.js";
import { ButtonsCreate } from "./ButtonsCreate.js";
import { Search } from "./Search.js";
import { Title } from "./Title.js";

interface HeaderProps {
    isRoot: boolean;
    title?: string;
    canCreateFolder: boolean;
    canCreateContent: boolean;
    onCreateDocument: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
}

export const Header = (props: HeaderProps) => {
    const { title, isRoot, canCreateFolder, canCreateContent, onCreateDocument, onCreateFolder } =
        props;

    return (
        <>
            <div className={"flex flex-col gap-md"}>
                <Title title={title} isRoot={isRoot} />
                <div className={"px-md pb-sm"}>
                    <div className={"flex items-center gap-sm w-full"}>
                        <div className={"flex-1"}>
                            <Search />
                        </div>
                        <div>
                            <div className={"flex gap-sm"}>
                                <ButtonFilters />
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
