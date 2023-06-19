import React from "react";
import styled from "@emotion/styled";
import { FolderTree, useNavigateFolder } from "@webiny/app-aco";
import { SidebarContainer } from "./styled";
import { Typography } from "@webiny/ui/Typography";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Link } from "@webiny/react-router";
import { useModel } from "~/admin/components/ModelProvider";
import { i18n } from "@webiny/app/i18n";
import { css } from "emotion";

const t = i18n.ns("app-headless-cms/admin/content-entries/table");

const ModelName = styled("div")({
    padding: "10px",
    fontSize: "24px"
});
const ModelId = styled("span")({
    color: "var(--mdc-theme-text-secondary-on-background)"
});

const disabled = css({
    color: "rgba(0, 0, 0, 0.54)",
    cursor: "default"
});

interface Props {
    folderId?: string;
    rootFolderLabel: string;
}

export const Sidebar: React.VFC<Props> = ({ folderId, rootFolderLabel }) => {
    const { navigateToFolder } = useNavigateFolder();

    const { model } = useModel();

    return (
        <SidebarContainer>
            <ModelName>
                {model.name}
                <br />
                <Typography use={"subtitle1"}>
                    <ModelId>
                        Model ID:{" "}
                        {model.plugin ? (
                            <Tooltip
                                content={t`Content model is registered via a plugin.`}
                                placement={"top"}
                            >
                                <Link to="#" className={disabled}>
                                    {model.modelId}
                                </Link>
                            </Tooltip>
                        ) : (
                            <Tooltip content={t`Edit content model`} placement={"top"}>
                                <Link to={`/cms/content-models/${model.modelId}`}>
                                    {model.modelId}
                                </Link>
                            </Tooltip>
                        )}
                    </ModelId>
                </Typography>
            </ModelName>
            <FolderTree
                rootFolderLabel={rootFolderLabel}
                focusedFolderId={folderId}
                onFolderClick={data => navigateToFolder(data.id)}
                enableActions={true}
                enableCreate={true}
            />
        </SidebarContainer>
    );
};