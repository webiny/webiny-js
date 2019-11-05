// @flow
/* eslint-disable */
import React from "react";
import bytes from "bytes";
import { css } from "emotion";
import { Drawer, DrawerContent } from "@webiny/ui/Drawer";
import { IconButton } from "@webiny/ui/Button";
import getFileTypePlugin from "./getFileTypePlugin";
import get from "lodash.get";
import Tags from "./FileDetails/Tags";
import Name from "./FileDetails/Name";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useHotkeys } from "react-hotkeyz";
import { ReactComponent as DownloadIcon } from "./icons/round-cloud_download-24px.svg";
import { ReactComponent as DeleteIcon } from "./icons/delete.svg";
import TimeAgo from "timeago-react";
import { useFileManager } from "./FileManagerContext";
import { useMutation } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { DELETE_FILE } from "./graphql";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-admin/file-manager/file-details");

const style = {
    wrapper: css({
        padding: 10,
        height: "100%",
        overflow: "auto"
    }),
    header: css({
        textAlign: "center",
        fontSize: 18,
        padding: 10,
        fontWeight: "600",
        color: "var(--mdc-theme-on-surface)"
    }),
    preview: css({
        backgroundColor: "var(--mdc-theme-background)",
        padding: 10,
        position: "relative",
        width: 200,
        height: 200,
        margin: "0 auto",
        img: {
            maxHeight: 200,
            maxWidth: 200,
            width: "auto",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translateX(-50%) translateY(-50%)",
            backgroundColor: "#fff"
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
            padding: 10,
            lineHeight: "22px",
            "li-title": {
                fontWeight: "600",
                display: "block"
            },
            "li-content": {
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
                display: "block"
            }
        }
    })
};

export default function FileDetails(props: *) {
    const { file, uploadFile, validateFiles } = props;
    const filePlugin = getFileTypePlugin(file);
    const actions = get(filePlugin, "fileDetails.actions") || [];

    const { hideFileDetails } = useFileManager();

    useHotkeys({
        zIndex: 55,
        disabled: !file,
        keys: {
            esc: hideFileDetails
        }
    });

    const [deleteFile] = useMutation(DELETE_FILE, { refetchQueries: ["ListFiles"] });
    const { showSnackbar } = useSnackbar();

    const { showConfirmation: showDeleteConfirmation } = useConfirmationDialog({
        title: t`Delete file`,
        message: file && (
            <span>
                {t`You're about to delete file {name}. Are you sure you want to continue?`({
                    name: file.name
                })}
            </span>
        )
    });

    return (
        <Drawer dir="rtl" modal open={file} onClose={hideFileDetails}>
            {file && (
                <div className={style.wrapper} dir="ltr">
                    <div className={style.header}>File details</div>
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

                            <Tooltip content={<span>{t`Delete image`}</span>} placement={"bottom"}>
                                <IconButton
                                    icon={<DeleteIcon style={{ margin: "0 8px 0 0" }} />}
                                    onClick={() =>
                                        showDeleteConfirmation(async () => {
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
                        </>
                    </div>
                    <DrawerContent dir="ltr">
                        <ul className={style.list}>
                            <li>
                                <li-title>{t`Name:`}</li-title>
                                <Name {...props} />
                            </li>
                            <li>
                                <li-title>{t`Size:`}</li-title>
                                <li-content>{bytes.format(file.size)}</li-content>
                            </li>
                            <li>
                                <li-title>{t`Type:`}</li-title>
                                <li-content>{file.type}</li-content>
                            </li>
                            <li>
                                <li-title>{t`Tags:`}</li-title>
                                <Tags {...props} />
                            </li>
                            <li>
                                <li-title>{t`Created:`}</li-title>
                                <li-content>
                                    <TimeAgo datetime={file.createdOn} />
                                </li-content>
                            </li>
                        </ul>
                    </DrawerContent>
                </div>
            )}
        </Drawer>
    );
}
