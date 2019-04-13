// @flow
/* eslint-disable */
import React from "react";
import bytes from "bytes";
import { css } from "emotion";
import { Drawer, DrawerContent } from "webiny-ui/Drawer";
import { ButtonPrimary } from "webiny-ui/Button";
import { Link } from "webiny-app/router";
import Tags from "./FileDetails/Tags";

const style = {
    wrapper: css({
        padding: 10
    }),
    header: css({
        textAlign: "center",
        fontSize: 18,
        padding: 10,
        fontWeight: "600",
        color: "var(--mdc-theme-on-surface)"
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
            <div className={style.wrapper}>
                <div className={style.header}>File details</div>
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
                            <li>
                                <li-content>
                                    <Link target="_blank" url={file.src}>
                                        <ButtonPrimary>Download</ButtonPrimary>
                                    </Link>
                                </li-content>
                            </li>
                        </ul>
                    </DrawerContent>
                )}
            </div>
        </Drawer>
    );
}
