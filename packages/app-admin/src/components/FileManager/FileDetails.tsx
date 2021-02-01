import React, { useMemo } from "react";
import bytes from "bytes";
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
import { useHotkeys } from "react-hotkeyz";
import { ReactComponent as DownloadIcon } from "./icons/round-cloud_download-24px.svg";
import { ReactComponent as DeleteIcon } from "./icons/delete.svg";
import { ReactComponent as ImageIcon } from "../../assets/icons/insert_photo-24px.svg";
import { ReactComponent as FileIcon } from "../../assets/icons/insert_drive_file-24px.svg";
import { ReactComponent as CalendarIcon } from "../../assets/icons/today-24px.svg";
import { useFileManager } from "./FileManagerContext";
import { useMutation } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { DELETE_FILE, LIST_FILES, LIST_TAGS } from "./graphql";
import { i18n } from "@webiny/app/i18n";
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
    wrapper: css({}),
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
        }
    }),
    download: css({
        textAlign: "center",
        margin: "0 auto",
        width: "100%"
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
    })
};

export default function FileDetails(props) {
    const { file, uploadFile, validateFiles } = props;
    const filePlugin = getFileTypePlugin(file);
    const actions = get(filePlugin, "fileDetails.actions") || [];

    const { hideFileDetails, queryParams } = useFileManager();

    useHotkeys({
        zIndex: 55,
        disabled: !file,
        keys: {
            esc: hideFileDetails
        }
    });

    const [deleteFile] = useMutation(DELETE_FILE, {
        update: cache => {
            // 1. Update files list cache
            const data: any = cloneDeep(
                cache.readQuery({
                    query: LIST_FILES,
                    variables: queryParams
                })
            );
            const filteredList = data.fileManager.listFiles.data.filter(
                item => item.id !== file.id
            );
            const selectedFile = data.fileManager.listFiles.data.find(item => item.id === file.id);

            cache.writeQuery({
                query: LIST_FILES,
                variables: queryParams,
                data: set(data, "fileManager.listFiles.data", filteredList)
            });
            // 2. Update "ListTags" cache
            if (Array.isArray(selectedFile.tags)) {
                const tagCountMap = {};
                // Prepare "tag" count map
                data.fileManager.listFiles.data.forEach(file => {
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
                const listTagsData: any = cloneDeep(
                    cache.readQuery({
                        query: LIST_TAGS
                    })
                );
                // Remove selected file tags from list.
                const filteredTags = listTagsData.fileManager.listTags.filter(tag => {
                    if (!selectedFile.tags.includes(tag)) {
                        return true;
                    }
                    return tagCountMap[tag] > 1;
                });

                // Write it to cache
                cache.writeQuery({
                    query: LIST_TAGS,
                    data: set(data, "fileManager.listTags", filteredTags)
                });
            }
        }
    });
    const { showSnackbar } = useSnackbar();

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
            open={file}
            onClose={hideFileDetails}
        >
            {file && (
                <div className={style.wrapper} dir="ltr">
                    <div className={style.header}>
                        <Typography use={"headline5"}>{t`File details`}</Typography>
                    </div>
                    <div className={style.preview}>
                        {filePlugin.render({ file, uploadFile, validateFiles })}
                    </div>
                    <div className={style.download}>
                        <>
                            <Tooltip content={<span>{t`Download file`}</span>} placement={"bottom"}>
                                <IconButton
                                    onClick={() => window.open(file.src, "_blank")}
                                    icon={<DownloadIcon style={{ margin: "0 8px 0 0" }} />}
                                />
                            </Tooltip>

                            {actions.map((Component, index) => (
                                <Component key={index} {...props} />
                            ))}

                            <ConfirmationDialog
                                {...fileDeleteConfirmationProps}
                                data-testid={"fm-delete-file-confirmation-dialog"}
                                style={{ zIndex: 100 }}
                            >
                                {({ showConfirmation }) => {
                                    return (
                                        <Tooltip
                                            content={<span>{t`Delete image`}</span>}
                                            placement={"bottom"}
                                        >
                                            <IconButton
                                                data-testid={"fm-delete-file-button"}
                                                icon={
                                                    <DeleteIcon style={{ margin: "0 8px 0 0" }} />
                                                }
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
                        </>
                    </div>
                    <DrawerContent dir="ltr">
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
}
