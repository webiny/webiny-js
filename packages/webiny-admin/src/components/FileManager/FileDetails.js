// @flow
/* eslint-disable */
import React from "react";
import bytes from "bytes";
import { css } from "emotion";
import { Drawer, DrawerContent } from "webiny-ui/Drawer";
import { IconButton } from "webiny-ui/Button";
import getFileTypePlugin from "./getFileTypePlugin";
import get from "lodash/get";
import Tags from "./FileDetails/Tags";
import Name from "./FileDetails/Name";
import { Tooltip } from "webiny-ui/Tooltip";
import { useHotkeys } from "react-hotkeyz";
import { ReactComponent as DownloadIcon } from "./icons/round-cloud_download-24px.svg";
import TimeAgo from "timeago-react";

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
    const { file, uploadFile, onClose, validateFiles } = props;
    const filePlugin = getFileTypePlugin(file);
    const actions = get(filePlugin, "fileDetails.actions") || [];

    useHotkeys({
        zIndex: 2,
        disabled: !file,
        keys: {
            esc: onClose
        }
    });

    return (
        <Drawer dir="rtl" modal open={file} onClose={onClose}>
            {file && (
                <div className={style.wrapper} dir="ltr">
                    <div className={style.header}>File details</div>
                    <div className={style.preview}>
                        {filePlugin.render({ file, uploadFile, validateFiles })}
                    </div>
                    <div className={style.download}>
                        <>
                            <Tooltip content={<span>Download file</span>} placement={"bottom"}>
                                <IconButton
                                    onClick={() => window.open(file.src, "_blank")}
                                    icon={<DownloadIcon style={{ margin: "0 8px 0 0" }} />}
                                />
                            </Tooltip>

                            {actions.map((Component, index) => (
                                <Component key={index} {...props} />
                            ))}
                        </>
                    </div>
                    <DrawerContent dir="ltr">
                        <ul className={style.list}>
                            <li>
                                <li-title>Name:</li-title>
                                <Name {...props} />
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
                            <li>
                                <li-title>Created:</li-title>
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
