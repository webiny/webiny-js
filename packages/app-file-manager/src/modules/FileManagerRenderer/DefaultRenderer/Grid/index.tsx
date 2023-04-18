import React, { ReactElement } from "react";
import { FolderItem, SearchRecordItem } from "@webiny/app-aco/types";
import { FileItem } from "@webiny/app/types";
import { Settings } from "~/types";
import styled from "@emotion/styled";
import getFileTypePlugin from "~/getFileTypePlugin";
import FileThumbnail, { FileProps } from "~/modules/FileManagerRenderer/DefaultRenderer/File";

import { EmptyView } from "~/modules/FileManagerRenderer/DefaultRenderer/EmptyView";
import { Folder } from "~/components/Folder";

interface GridProps {
    records: FileItem[];
    folders: FolderItem[];
    loading?: boolean;
    onRecordClick: (id: string) => void;
    onFolderClick: (id: string) => void;
    selected: FileItem[];
    multiple?: boolean;
    toggleSelected: (file: FileItem) => void;
    onChange?: Function;
    onClose?: Function;
}

const FolderList = styled("div")({
    width: "100%",
    display: "grid",
    /* define the number of grid columns */
    gridTemplateColumns: "repeat( auto-fill, minmax(220px, 1fr) )",
    columnGap: 16,
    rowGap: 16,
    margin: 16
});

const FileList = styled("div")({
    width: "100%",
    display: "grid",
    /* define the number of grid columns */
    gridTemplateColumns: "repeat( auto-fill, minmax(220px, 1fr) )",
    columnGap: 16,
    rowGap: 16,
    margin: 16,
    marginBottom: 95
});

interface RenderFileProps extends Omit<FileProps, "children"> {
    file: FileItem;
    children?: React.ReactNode;
}

const renderFile: React.FC<RenderFileProps> = props => {
    const { file } = props;
    const plugin = getFileTypePlugin(file);
    if (!plugin) {
        return null;
    }

    return (
        <FileThumbnail {...props} key={file.id}>
            {plugin.render({
                /**
                 * TODO @ts-refactor
                 */
                // @ts-ignore
                file
            })}
        </FileThumbnail>
    );
};

export const Grid = (props: GridProps): ReactElement => {
    const {
        folders,
        records,
        onRecordClick,
        onFolderClick,
        selected,
        onChange,
        onClose,
        toggleSelected,
        multiple
    } = props;

    return (
        <>
            {folders.length && (
                <FolderList>
                    {folders.map(folder => (
                        <Folder key={folder.id} folder={folder} onFolderClick={onFolderClick} />
                    ))}
                </FolderList>
            )}
            <FileList>
                {records.length ? (
                    records.map(record =>
                        renderFile({
                            file: record,
                            showFileDetails: onRecordClick,
                            selected: selected.some(current => current.id === record.id),
                            onSelect: async () => {
                                if (typeof onChange === "function") {
                                    if (multiple) {
                                        toggleSelected(record);
                                        return;
                                    }

                                    await onChange(record);
                                    onClose && onClose();
                                }
                            }
                        })
                    )
                ) : (
                    <EmptyView browseFiles={() => console.log("demo")} />
                )}
            </FileList>
        </>
    );
};
