import * as React from "react";
import Helmet from "react-helmet";
import { css } from "emotion";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { useTenancy } from "@webiny/app-tenancy/hooks/useTenancy";
import { useSecurity } from "@webiny/app-security";
import { makeComposable } from "@webiny/app-admin";
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
        cursor: "pointer",
        textDecoration: "none",
        "&:hover": {
            textDecoration: "underline"
        }
    })
};

export interface ImageProps {
    className?: string;
    alt?: string;
}

const Image = ({ className = styles.authErrorImgStyle, alt = "Not Authorized" }: ImageProps) => {
    return <img className={className} src={authErrorImg} alt={alt} />;
};

const NotAuthorizedComponent = makeComposable("NotAuthorizedError", () => {
    const { setTenant } = useTenancy();
    const { identity } = useSecurity();

    const defaultTenant = identity && identity.defaultTenant ? identity.defaultTenant.id : null;

    const resetTenant = (): void => {
        setTenant(defaultTenant);
    };

    return (
        <ContentWrapper>
            <Helmet title={"Not authorized!"} />
            <Image />

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
});

export const NotAuthorizedError = Object.assign(NotAuthorizedComponent, { Image });
