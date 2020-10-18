import * as React from "react";
import { Typography } from "@webiny/ui/Typography";
import { css } from "emotion";

const menuSectionTitle = css({
    marginLeft: 20,
    display: "flex",
    alignItems: "center",
    color: "var(--mdc-theme-on-surface)"
});

const iconWrapper = css({
    marginRight: 5,
    color: "var(--mdc-theme-on-surface)"
});

type Props = { label: React.ReactNode; children: React.ReactNode; icon?: React.ReactNode };

export default function Section(props: Props) {
    const { children, label, icon } = props;
    return (
        <>
            <div className={menuSectionTitle}>
                <div className={iconWrapper}>{icon}</div>
                <Typography use="overline">{label}</Typography>
            </div>
            {children}
        </>
    );
}
