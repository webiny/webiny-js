import * as React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { Link } from "@webiny/react-router";
import { Typography } from "@webiny/ui/Typography";
import { Compose, NotFound as NotFoundSpec } from "@webiny/app-admin";
import authErrorImg from "./SecureRouteError.svg";

const ContentWrapper = styled("div")({
    display: "block",
    paddingTop: "15%",
    textAlign: "center",
    margin: "auto"
});

const styles = {
    authErrorImgStyle: css({
        width: "192px",
        paddingBottom: "24px"
    }),
    bodyStyle: css({
        color: "var(--mdc-theme-text-primary-on-background)",
        display: "block"
    }),
    linkStyle: css({
        textDecoration: "none",
        "&:hover": {
            textDecoration: "none"
        }
    })
};

const NotFoundHOC = () => {
    return function NotFound() {
        return (
            <ContentWrapper>
                <img className={styles.authErrorImgStyle} src={authErrorImg} alt="Not Accessible" />

                <Typography use={"body1"} className={styles.bodyStyle}>
                    The route is either missing, or you&apos;re not authorized to view it.
                </Typography>

                <Typography use={"body1"} className={styles.bodyStyle}>
                    Please contact your administrator to report the issue.
                </Typography>

                <Link to="/" className={styles.linkStyle}>
                    Take me back.
                </Link>
            </ContentWrapper>
        );
    };
};

export const NotFound = () => {
    return <Compose component={NotFoundSpec} with={NotFoundHOC} />;
};
