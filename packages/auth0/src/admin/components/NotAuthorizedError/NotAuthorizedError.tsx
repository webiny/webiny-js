import * as React from "react";
import Helmet from "react-helmet";
import { css } from "emotion";
import styled from "@emotion/styled";
import { Text } from "@webiny/admin-ui";
import { useAuthentication, useTenancy } from "@webiny/app-admin";
import { makeDecoratable } from "@webiny/app-admin";
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
        paddingBottom: "24px",
        margin: "0 auto"
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

const NotAuthorizedComponent = makeDecoratable("NotAuthorizedError", () => {
    const { setTenant } = useTenancy();
    const { identity } = useAuthentication();

    const defaultTenant = identity && identity.defaultTenant ? identity.defaultTenant.id : null;

    const resetTenant = (): void => {
        setTenant(defaultTenant);
    };

    return (
        <ContentWrapper>
            <Helmet title={"Not authorized!"} />
            <Image />
            <Text className={styles.bodyStyle}>You are not authorized to access this tenant!</Text>
            <Text className={styles.bodyStyle}>
                Please contact your administrator to request access.
            </Text>
            <a onClick={resetTenant} className={styles.linkStyle}>
                Take me home!
            </a>
        </ContentWrapper>
    );
});

export const NotAuthorizedError = Object.assign(NotAuthorizedComponent, { Image });
