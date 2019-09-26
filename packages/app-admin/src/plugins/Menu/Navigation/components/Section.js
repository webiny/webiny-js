// @flow
import * as React from "react";
import { Typography } from "@webiny/ui/Typography";
import { css } from "emotion";

const menuSubtitle = css({
    marginLeft: 20,
    display: "block",
    color: "var(--mdc-theme-on-surface)"
});

type Props = { label: React.Node, children: React.Node };

export default function Section(props: Props) {
    const { children, label } = props;
    return (
        <React.Fragment>
            <Typography className={menuSubtitle} use="overline">
                {label}
            </Typography>
            {children}
        </React.Fragment>
    );
}
