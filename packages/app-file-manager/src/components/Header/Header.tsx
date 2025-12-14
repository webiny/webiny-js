import React from "react";
import type { FilesRenderChildren } from "react-butterfiles";
import { Separator } from "@webiny/admin-ui";

import { Actions } from "./Actions.js";
import { Title } from "./Title.js";

export interface BrowseFilesHandler {
    browseFiles: FilesRenderChildren["browseFiles"];
}

export interface HeaderProps {
    browseFiles: BrowseFilesHandler["browseFiles"];
}

export const Header = (props: HeaderProps) => {
    return (
        <div>
            <div className={"pl-lg pr-md py-sm-extra"}>
                <Title />
                <div className={"pb-sm"} />
                <Actions browseFiles={props.browseFiles} />
            </div>
            <Separator />
        </div>
    );
};
