import React from "react";
import type { FilesRenderChildren } from "react-butterfiles";

import { Actions } from "./Actions.js";
import { Title } from "./Title.js";
import { SearchWidget } from "~/components/SearchWidget/index.js";

export interface BrowseFilesHandler {
    browseFiles: FilesRenderChildren["browseFiles"];
}

export interface HeaderProps {
    browseFiles: BrowseFilesHandler["browseFiles"];
}

export const Header = (props: HeaderProps) => {
    return (
        <div className={"flex flex-col gap-md"}>
            <Title />
            <div className={"px-md pb-sm"}>
                <div className={"flex items-center gap-sm w-full"}>
                    <div className={"flex-1"}>
                        <SearchWidget />
                    </div>
                    <div>
                        <div className={"flex gap-sm"}>
                            <Actions browseFiles={props.browseFiles} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
