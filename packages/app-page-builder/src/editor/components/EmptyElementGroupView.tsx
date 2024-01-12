import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";

const EmptyViewWrapper = styled("div")({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "48px 16px 16px",

    "& .media": {
        "& svg": {
            width: 75,
            height: 75,
            fill: "var(--mdc-theme-text-icon-on-background)"
        },
        marginBottom: 24
    },
    "& .title": {
        color: "var(--mdc-theme-text-primary-on-background)",
        marginBottom: 16
    },
    "& .body": {
        color: "var(--mdc-theme-text-secondary-on-background)",
        textAlign: "center"
    }
});
export interface EmptyElementGroupViewProps {
    icon: React.ReactElement;
    title: string;
    body: string;
}
const EmptyElementGroupView = ({ icon, title, body }: EmptyElementGroupViewProps) => {
    return (
        <EmptyViewWrapper>
            <div className={"media"}>{icon}</div>
            <Typography use={"headline6"} className={"title"}>
                {title}
            </Typography>
            <Typography use={"body1"} className={"body"}>
                {body}
            </Typography>
        </EmptyViewWrapper>
    );
};

export default EmptyElementGroupView;
