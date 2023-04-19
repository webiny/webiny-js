import { useCopyFile } from "~/modules/Hooks/useCopyFile";

export { useFile } from "./FileDetails/FileProvider";
import React, { useMemo, useState } from "react";
import bytes from "bytes";
import classNames from "classnames";
import { css } from "emotion";
import styled from "@emotion/styled";
import { Drawer, DrawerContent } from "@webiny/ui/Drawer";
import { IconButton } from "@webiny/ui/Button";
import dayjs from "dayjs";
import get from "lodash/get";
import Tags from "./FileDetails/Tags";
import Name from "./FileDetails/Name";
import { Aliases } from "./FileDetails/Aliases";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";
import { ReactComponent as CloseIcon } from "@material-design-icons/svg/outlined/close.svg";
import { ReactComponent as CopyContentIcon } from "@material-design-icons/svg/outlined/content_copy.svg";
import { ReactComponent as ImageIcon } from "@material-design-icons/svg/outlined/insert_photo.svg";
import { ReactComponent as FileIcon } from "@material-design-icons/svg/outlined/insert_drive_file.svg";
import { ReactComponent as CalendarIcon } from "@material-design-icons/svg/outlined/today.svg";
import { ReactComponent as HighlightIcon } from "@material-design-icons/svg/outlined/highlight.svg";
import { i18n } from "@webiny/app/i18n";
import { FileProvider } from "./FileDetails/FileProvider";
import { DeleteImageAction } from "./FileDetails/DeleteImageAction";
import { FileItem } from "@webiny/app-admin/types";
import { useSnackbar } from "@webiny/app-admin";
import getFileTypePlugin from "~/getFileTypePlugin";

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

const CloseButton = styled(IconButton)`
    position: absolute;
    right: 10px;
    top: 8px;
`;

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

export interface FileDetailsProps {
    file: FileItem;
    onClose: () => void;
}

export const FileDetails: React.FC<FileDetailsProps> = ({ file, onClose }) => {
    const filePlugin = getFileTypePlugin(file);

    const [darkImageBackground, setDarkImageBackground] = useState(false);
    const { copyFileUrl } = useCopyFile({ file });

    useHotkeys({
        zIndex: 55,
        disabled: !file,
        keys: {
            esc: onClose
        }
    });

    const actions: React.FC[] =
        get(filePlugin, "fileDetails.actions") || get(filePlugin, "actions") || [];

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
            onClose={onClose}
            data-testid={"fm.file-details.drawer"}
        >
            {file && (
                <FileProvider file={file}>
                    <div className={style.wrapper} dir="ltr">
                        <div className={style.header}>
                            <Typography use={"headline5"}>{t`File details`}</Typography>
                            <CloseButton icon={<CloseIcon />} onClick={onClose} />
                        </div>

                        <div
                            className={classNames(style.preview, {
                                dark: darkImageBackground
                            })}
                        >
                            {filePlugin && filePlugin.render({ file })}
                        </div>
                        <div className={style.download}>
                            <>
                                <Tooltip content={<span>{t`Copy URL`}</span>} placement={"bottom"}>
                                    <IconButton
                                        onClick={copyFileUrl}
                                        icon={<CopyContentIcon style={{ margin: "0 8px 0 0" }} />}
                                    />
                                </Tooltip>

                                {actions.map(
                                    (Component: React.FC<{ file: FileItem }>, index: number) => (
                                        <Component key={index} file={file} />
                                    )
                                )}
                                <DeleteImageAction onDelete={onClose} />
                                {/* Render background switcher */}
                                <Tooltip content={t`Toggle background`} placement={"bottom"}>
                                    <IconButton
                                        icon={<HighlightIcon />}
                                        onClick={() => setDarkImageBackground(!darkImageBackground)}
                                        className={classNames({
                                            "icon--active": darkImageBackground
                                        })}
                                    />
                                </Tooltip>
                            </>
                        </div>
                        <DrawerContent dir="ltr" className={style.drawerContent}>
                            <ul className={style.list}>
                                <li>
                                    <Name />
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
                                        <Icon
                                            className={"list-item__icon"}
                                            icon={<CalendarIcon />}
                                        />
                                        <div>
                                            <Typography use={"subtitle1"}>
                                                {dayjs(file.createdOn).format(
                                                    "DD MMM YYYY [at] HH:mm"
                                                )}
                                            </Typography>
                                        </div>
                                    </li-title>
                                </li>
                                <li>
                                    <Tags />
                                </li>
                                <li>
                                    <Aliases />
                                </li>
                            </ul>
                        </DrawerContent>
                    </div>
                </FileProvider>
            )}
        </Drawer>
    );
};
