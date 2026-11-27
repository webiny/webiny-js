import * as React from "react";
import Helmet from "react-helmet";
import { Text } from "@webiny/admin-ui";
import authErrorImg from "./SecureRouteError.svg";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { useRouter } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

const styles = {
    authErrorImgStyle: "w-[192px] pb-lg",
    bodyStyle: "block [&_strong]:font-bold",
    linkStyle: "cursor-pointer no-underline hover:underline"
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
        <div className={"block pt-[15%] text-center m-auto"}>
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
        </div>
    );
};
