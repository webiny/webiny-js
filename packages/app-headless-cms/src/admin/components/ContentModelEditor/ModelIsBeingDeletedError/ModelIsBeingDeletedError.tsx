import * as React from "react";
import Helmet from "react-helmet";
import { css } from "@emotion/css";
import styled from "@emotion/styled";
import { Text } from "@webiny/admin-ui";
import authErrorImg from "./SecureRouteError.svg";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { useRouter } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

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
        display: "block",
        " strong": {
            fontWeight: "bold"
        }
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

export interface IModelIsBeingDeletedProps {
    model: Pick<CmsModel, "name">;
}

export const ModelIsBeingDeletedError = (props: IModelIsBeingDeletedProps) => {
    const { goToRoute } = useRouter();

    const goBack = (): void => {
        goToRoute(Routes.ContentModels.List);
    };

    return (
        <ContentWrapper>
            <Helmet title={"Cannot access the model!"} />
            <Image />

            <Text size={"md"} className={styles.bodyStyle}>
                Model <strong>{props.model.name}</strong> is being deleted and cannot be accessed or
                changed.
            </Text>

            <p>
                <br />
            </p>

            <a onClick={goBack} className={styles.linkStyle}>
                Go back
            </a>
        </ContentWrapper>
    );
};
