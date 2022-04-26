import React, { useCallback, useMemo, useState } from "react";
import bytes from "bytes";
import classNames from "classnames";
import { css } from "emotion";
import { Drawer, DrawerContent } from "@webiny/ui/Drawer";
import { IconButton } from "@webiny/ui/Button";
import getFileTypePlugin from "./getFileTypePlugin";
import dayjs from "dayjs";
import get from "lodash/get";
import set from "lodash/set";
import cloneDeep from "lodash/cloneDeep";
import Tags from "./FileDetails/Tags";
import Name from "./FileDetails/Name";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
/**
 * Package react-hotkeyz has no types.
 */
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";
import { ReactComponent as CopyContentIcon } from "./icons/content_copy-black-24px.svg";
import { ReactComponent as DeleteIcon } from "./icons/delete.svg";
import { ReactComponent as ImageIcon } from "../../assets/icons/insert_photo-24px.svg";
import { ReactComponent as FileIcon } from "../../assets/icons/insert_drive_file-24px.svg";
import { ReactComponent as CalendarIcon } from "../../assets/icons/today-24px.svg";
import { ReactComponent as HighlightIcon } from "../../assets/icons/highlight-24px.svg";
import { getWhere, useFileManager } from "./FileManagerContext";
import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "~/hooks/useSnackbar";
import { useSecurity } from "@webiny/app-security";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import {
    DELETE_FILE,
    DeleteFileMutationResponse,
    DeleteFileMutationVariables,
    LIST_FILES,
    LIST_TAGS,
    ListFilesQueryResponse,
    ListFileTagsQueryResponse
} from "./graphql";
import { i18n } from "@webiny/app/i18n";
import mime from "mime";
import { FileItem, FileManagerSecurityPermission } from "./types";
import { FilesRenderChildren } from "react-butterfiles";

const t = i18n.ns("app-admin/file-manager/file-details");

const fileDetailsSidebar = css({
    "&.mdc-drawer": {
        width: 360
    }
});

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "li-title": {
                children?: React.ReactNode;
            };

            "li-content": {
                children?: React.ReactNode;
            };
        }
    }
}

const style: any = {
    wrapper: css({
        height: "100vh",
        overflowY: "auto"
    }),
    header: css({
        textAlign: "center",
        marginBottom: 24,
        paddingTop: 16,
        "& span": {
            textTransform: "capitalize",
            color: "var(--mdc-theme-on-surface)",
            fontWeight: 600
        }
    }),
    preview: css({
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        width: "100%",
        height: 300,
        margin: "0 auto 24px",
        img: {
            objectFit: "contain",
            maxHeight: 300,
            maxWidth: 300,
            width: "100%",
            position: "static",
            transform: "none"
        },
        "&.dark": {
            backgroundColor: "var(--mdc-theme-background)"
        }
    }),
    download: css({
        textAlign: "center",
        margin: "0 auto",
        width: "100%",
        "& .icon--active": {
            "&.mdc-icon-button": {
                color: "var(--mdc-theme-text-on-primary)"
            }
        }
    }),
    list: css({
        textAlign: "left",
        color: "var(--mdc-theme-on-surface)",
        li: {
            padding: "12px 16px",
            lineHeight: "22px",
            "li-title": {
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                minHeight: 48,
                "& .list-item__title": {
                    fontWeight: 600
                },
                "& .list-item__icon": {
                    marginRight: 24
                },
                "& .list-item__content": {
                    flex: "1 0 200px"
                }
            },
            "li-content": {
                width: "100%",
                display: "block",
                "& .list-item__truncate": {
                    display: "block",
                    width: "100%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                }
            }
        }
    }),
    drawerContent: css({
        "&.mdc-drawer__content": {
            height: "auto",
            overflowY: "inherit"
        }
    })
};
interface FileDetailsProps {
    canEdit: (item: any) => boolean;
    file: FileItem;
    uploadFile: (files: FileItem[] | FileItem) => Promise<number | null>;
    validateFiles: FilesRenderChildren["validateFiles"];
    [key: string]: any;
}

const isImage = (file: FileItem) => {
    const fileType = mime.getType(file && file.name);

    if (fileType && typeof fileType === "string") {
        return fileType.includes("image");
    }

    return false;
};

const FileDetails: React.FC<FileDetailsProps> = props => {
    const { file, uploadFile, validateFiles } = props;

    const filePlugin = getFileTypePlugin(file);
    const actions: React.FC[] =
        get(filePlugin, "fileDetails.actions") || get(filePlugin, "actions") || [];

    const { hideFileDetails, queryParams } = useFileManager();
    const [darkImageBackground, setDarkImageBackground] = useState(false);

    const { identity, getPermission } = useSecurity();
    const fmFilePermission = useMemo((): FileManagerSecurityPermission | null => {
        return getPermission("fm.file");
    }, [identity]);
    const canDelete = useCallback(
        item => {
            // Bail out early if no access
            if (!fmFilePermission) {
                return false;
            }
            if (fmFilePermission.own) {
                const identityId = identity ? identity.id || identity.login : null;
                if (!identityId) {
                    return false;
                }
                return get(item, "createdBy.id") === identityId;
            }
            if (typeof fmFilePermission.rwd === "string") {
                return fmFilePermission.rwd.includes("d");
            }
            return true;
        },
        [fmFilePermission]
    );

    useHotkeys({
        zIndex: 55,
        disabled: !file,
        keys: {
            esc: hideFileDetails
        }
    });

    const [deleteFile] = useMutation<DeleteFileMutationResponse, DeleteFileMutationVariables>(
        DELETE_FILE,
        {
            update: cache => {
                // 1. Update files list cache
                let data = cloneDeep(
                    cache.readQuery<ListFilesQueryResponse>({
                        query: LIST_FILES,
                        variables: queryParams
                    })
                );
                if (!data) {
                    data = {
                        fileManager: {
                            listFiles: {
                                data: [],
                                error: null,
                                meta: {
                                    hasMoreItems: false,
                                    cursor: null,
                                    totalItem: 0
                                }
                            }
                        }
                    };
                }
                const filteredList = data.fileManager.listFiles.data.filter(
                    (item: FileItem) => item.id !== file.id
                );
                const selectedFile = data.fileManager.listFiles.data.find(
                    (item: FileItem) => item.id === file.id
                );

                cache.writeQuery({
                    query: LIST_FILES,
                    variables: queryParams,
                    data: set(data, "fileManager.listFiles.data", filteredList)
                });
                // 2. Update "ListTags" cache
                if (!selectedFile || Array.isArray(selectedFile.tags) === false) {
                    return;
                }
                const tagCountMap: Record<string, number> = {};
                // Prepare "tag" count map
                data.fileManager.listFiles.data.forEach((file: FileItem) => {
                    if (!Array.isArray(file.tags)) {
                        return;
                    }
                    file.tags.forEach(tag => {
                        if (tagCountMap[tag]) {
                            tagCountMap[tag] += 1;
                        } else {
                            tagCountMap[tag] = 1;
                        }
                    });
                });

                // Get tags from cache
                const listTagsData = cloneDeep(
                    cache.readQuery<ListFileTagsQueryResponse>({
                        query: LIST_TAGS,
                        variables: { where: getWhere(queryParams.scope) }
                    })
                );
                // Remove selected file tags from list.
                const filteredTags = (listTagsData?.fileManager?.listTags || []).filter(
                    (tag: string) => {
                        if (!selectedFile.tags.includes(tag)) {
                            return true;
                        }
                        return tagCountMap[tag] > 1;
                    }
                );

                // Write it to cache
                cache.writeQuery({
                    query: LIST_TAGS,
                    variables: { where: getWhere(queryParams.scope) },
                    data: set(data, "fileManager.listTags", filteredTags)
                });
            }
        }
    );
    const { showSnackbar } = useSnackbar();

    const renderDeleteImageAction = useCallback(file => {
        if (!canDelete(file)) {
            return null;
        }
        const fileDeleteConfirmationProps = {
            title: t`Delete file`,
            message: file && (
                <span>
                    {t`You're about to delete file {name}. Are you sure you want to continue?`({
                        name: file.name
                    })}
                </span>
            )
        };
        return (
            <ConfirmationDialog
                {...fileDeleteConfirmationProps}
                data-testid={"fm-delete-file-confirmation-dialog"}
                style={{ zIndex: 100 }}
            >
                {({ showConfirmation }) => {
                    return (
                        <Tooltip
                            content={
                                isImage(file) ? (
                                    <span>{t`Delete image`}</span>
                                ) : (
                                    <span>{t`Delete file`}</span>
                                )
                            }
                            placement={"bottom"}
                        >
                            <IconButton
                                data-testid={"fm-delete-file-button"}
                                icon={<DeleteIcon style={{ margin: "0 8px 0 0" }} />}
                                onClick={() =>
                                    showConfirmation(async () => {
                                        await deleteFile({
                                            variables: {
                                                id: file.id
                                            }
                                        });
                                        showSnackbar(t`File deleted successfully.`);
                                    })
                                }
                            />
                        </Tooltip>
                    );
                }}
            </ConfirmationDialog>
        );
    }, []);

    const fileTypeIcon = useMemo(() => {
        if (file && typeof file.type === "string") {
            return file.type.includes("image") ? <ImageIcon /> : <FileIcon />;
        }
        return <ImageIcon />;
    }, [file]);

    return (
        <Drawer
            className={fileDetailsSidebar}
            dir="rtl"
            modal
            open={Boolean(file)}
            onClose={hideFileDetails}
            data-testid={"fm.file-details.drawer"}
        >
            {file && (
                <div className={style.wrapper} dir="ltr">
                    <div className={style.header}>
                        <Typography use={"headline5"}>{t`File details`}</Typography>
                    </div>
                    <div
                        className={classNames(style.preview, {
                            dark: darkImageBackground
                        })}
                    >
                        {filePlugin &&
                            filePlugin.render({
                                /**
                                 * TODO: @ts-refactor
                                 * Figure out which type is the file
                                 */
                                // @ts-ignore
                                file,
                                uploadFile,
                                validateFiles
                            })}
                    </div>
                    <div className={style.download}>
                        <>
                            <Tooltip content={<span>{t`Copy URL`}</span>} placement={"bottom"}>
                                <IconButton
                                    onClick={() => {
                                        navigator.clipboard.writeText(file.src);
                                        showSnackbar(t`URL copied successfully.`);
                                    }}
                                    icon={<CopyContentIcon style={{ margin: "0 8px 0 0" }} />}
                                />
                            </Tooltip>

                            {actions.map((Component: React.FC, index: number) => (
                                <Component key={index} {...props} />
                            ))}
                            {renderDeleteImageAction(file)}
                            {/* Render background switcher */}
                            <Tooltip content={t`Toggle background`} placement={"bottom"}>
                                <IconButton
                                    icon={<HighlightIcon />}
                                    onClick={() => setDarkImageBackground(!darkImageBackground)}
                                    className={classNames({ "icon--active": darkImageBackground })}
                                />
                            </Tooltip>
                        </>
                    </div>
                    <DrawerContent dir="ltr" className={style.drawerContent}>
                        <ul className={style.list}>
                            <li>
                                <Name {...props} />
                            </li>
                            <li>
                                <li-title>
                                    <Icon className={"list-item__icon"} icon={fileTypeIcon} />
                                    <div>
                                        <Typography use={"subtitle1"}>{file.type}</Typography>{" "}
                                        {" - "}
                                        <Typography use={"subtitle1"}>
                                            {bytes.format(file.size, { unitSeparator: " " })}
                                        </Typography>
                                    </div>
                                </li-title>
                            </li>
                            <li>
                                <li-title>
                                    <Icon className={"list-item__icon"} icon={<CalendarIcon />} />
                                    <div>
                                        <Typography use={"subtitle1"}>
                                            {dayjs(file.createdOn).format("DD MMM YYYY [at] HH:mm")}
                                        </Typography>
                                    </div>
                                </li-title>
                            </li>
                            <li>
                                <Tags key={props.file.id} {...props} />
                            </li>
                        </ul>
                    </DrawerContent>
                </div>
            )}
        </Drawer>
    );
};

export default FileDetails;
