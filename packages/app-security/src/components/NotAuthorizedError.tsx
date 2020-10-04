import * as React from "react";
import { Link } from "@webiny/react-router";
import { css } from "emotion";
import styled from "@emotion/styled";
import Helmet from "react-helmet";
import authErrorImg from "../admin/assets/images/SecureRouteError.svg";
import { Typography } from "@webiny/ui/Typography";

const ContentWrapper = styled("div")({
    display: "block",
    padding: 25,
    textAlign: "center",
    margin: "auto"
});

const styles = {
    authErrorImgStyle: css({
        width: "192px"
    }),
    bodyStyle: css({
        color: "var(--mdc-theme-text-primary-on-background)"
    }),
    linkStyle: css({
        textDecoration: "none",
        "&:hover": {
            textDecoration: "none"
        },
    })
};

const NotAuthorizedError = () => {
    return (
        <ContentWrapper>
            <Helmet title={"Not authorized"} />
            <img
                className={styles.authErrorImgStyle}
                src={authErrorImg}
                alt="Not Authorized"
            />
            <Typography use={"body1"} className={styles.bodyStyle}>
                You are not authorized to view this route.
            </Typography>
            <Typography use={"body1"} className={styles.bodyStyle}>
                Please contact your administrator to request access.
            </Typography>
            <Link to="/" className={styles.linkStyle}>
                Take me back.
            </Link>
        </ContentWrapper>
    );
};

export default NotAuthorizedError;
