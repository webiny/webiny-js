import * as React from "react";
import { Link } from "@webiny/react-router";
import { css } from "emotion";
import styled from "@emotion/styled";
import Helmet from "react-helmet";
import authErrorImg from "../admin/assets/images/SecureRouteError.svg";
import { Typography } from "@webiny/ui/Typography";

const ContentWrapper = styled("div")({
    display: "block",
    paddingTop: "15%",
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
        }
    }),
    divStyles: css({
        padding: "5px"
    })
};

const NotAuthorizedError = () => {
    return (
        <ContentWrapper>
            <Helmet title={"Not authorized"} />
            <img className={styles.authErrorImgStyle} src={authErrorImg} alt="Not Authorized" />
            
            <div className={styles.divStyles}>
                <Typography use={"body1"} className={styles.bodyStyle}>
                    You are not authorized to view this route.
                </Typography>
            </div>

            <div className={styles.divStyles}>
                <Typography use={"body1"} className={styles.bodyStyle}>
                    Please contact your administrator to request access.
                </Typography>
            </div>

            <div className={styles.divStyles}>
                <Link to="/" className={styles.linkStyle}>
                    Take me back.
                </Link>
            </div>
        </ContentWrapper>
    );
};

export default NotAuthorizedError;
