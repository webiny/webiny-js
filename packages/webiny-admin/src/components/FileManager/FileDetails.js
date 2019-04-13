// @flow
/* eslint-disable */
import React from "react";
import bytes from "bytes";
import { css } from "emotion";
import { Drawer, DrawerContent } from "webiny-ui/Drawer";
import { IconButton } from "webiny-ui/Button";
import { Link } from "webiny-app/router";
import { Image } from "webiny-app/components";
import Tags from "./FileDetails/Tags";
import { Tooltip } from "webiny-ui/Tooltip";

import { ReactComponent as DownloadIcon } from "./icons/round-cloud_download-24px.svg";

import { ReactComponent as EditIcon } from "./icons/round-edit-24px.svg";

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
    const { file, onClose } = props;
    return (
        <Drawer dir="rtl" modal open={file} onClose={onClose}>
            <div className={style.wrapper} dir="ltr">
                <div className={style.header}>File details</div>
                <div className={style.preview}>
                    {file && <Image src={file.src} alt={file.name} transform={{ width: 300 }} />}
                </div>
                <div className={style.download}>
                    {file && (
                        <>
                            <Tooltip content={<span>Download file</span>} placement={"bottom"}>
                                <IconButton
                                    onClick={() => window.open(file.src, "_blank")}
                                    icon={<DownloadIcon style={{ margin: "0 8px 0 0" }} />}
                                />
                            </Tooltip>
                            <Tooltip content={<span>Edit image</span>} placement={"bottom"}>
                                <IconButton icon={<EditIcon style={{ margin: "0 8px 0 0" }} />} />
                            </Tooltip>
                        </>
                    )}
                </div>
                {file && (
                    <DrawerContent dir="ltr">
                        <ul className={style.list}>
                            <li>
                                <li-title>Name:</li-title>
                                <li-content>{file.name}</li-content>
                            </li>
                            <li>
                                <li-title>Size:</li-title>
                                <li-content>{bytes.format(file.size)}</li-content>
                            </li>
                            <li>
                                <li-title>Type:</li-title>
                                <li-content>{file.type}</li-content>
                            </li>
                            <li>
                                <li-title>Tags:</li-title>
                                <Tags {...props} />
                            </li>
                        </ul>
                    </DrawerContent>
                )}
            </div>
        </Drawer>
    );
}
