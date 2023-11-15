import * as React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import Helmet from "react-helmet";
import authErrorImg from "./SecureRouteError.svg";
import { Typography } from "@webiny/ui/Typography";
import { useTenancy } from "@webiny/app-admin";

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
        cursor: "pointer",
        textDecoration: "none",
        "&:hover": {
            textDecoration: "underline"
        }
    })
};

export const NotAuthorizedError: React.FC = () => {
    const { setTenant } = useTenancy();

    const resetTenant = (): void => {
        setTenant(null);
    };

    return (
        <ContentWrapper>
            <Helmet title={"Not authorized!"} />

            <img className={styles.authErrorImgStyle} src={authErrorImg} alt="Not Authorized" />

            <Typography use={"body1"} className={styles.bodyStyle}>
                You are not authorized to access this tenant!
            </Typography>

            <Typography use={"body1"} className={styles.bodyStyle}>
                Please contact your administrator to request access.
            </Typography>

            <a onClick={resetTenant} className={styles.linkStyle}>
                Take me home!
            </a>
        </ContentWrapper>
    );
};
