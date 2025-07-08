import React from "react";
import { Separator } from "@webiny/admin-ui";
import { ButtonsCreate } from "./ButtonsCreate";
import { Search } from "./Search";
import { Title } from "./Title";

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
            <div className={"wby-flex wby-flex-col wby-gap-md"}>
                <Title title={title} isRoot={isRoot} />
                <div className={"wby-px-md wby-pb-sm"}>
                    <div className={"wby-flex wby-items-center wby-gap-sm wby-w-full"}>
                        <div className={"wby-flex-1"}>
                            <Search />
                        </div>
                        <div>
                            <div className={"wby-flex wby-gap-sm"}>
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
