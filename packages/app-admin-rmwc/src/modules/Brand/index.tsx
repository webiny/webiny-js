import React, { Fragment, useCallback } from "react";
import {
    Compose,
    BrandRenderer,
    HigherOrderComponent,
    useTags,
    Logo,
    AddLogo
} from "@webiny/app-admin";
import { Link } from "@webiny/react-router/";
import { ReactComponent as LogoIcon } from "./webiny-logo.svg";
import { useNavigation } from "../Navigation";

const BrandImpl: HigherOrderComponent = () => {
    return function BrandRenderer() {
        const { location } = useTags();
        const { setVisible } = useNavigation();

        const onClick = useCallback(() => {
            location === "navigation" ? setVisible(false) : null;
        }, []);

        return (
            <Link to={"/"} onClick={onClick}>
                <Logo />
            </Link>
        );
    };
};

const WebinyLogo = () => {
    const { location } = useTags();

    return (
        <LogoIcon
            style={{
                width: 100,
                height: 30,
                paddingLeft: 20,
                color: location === "navigation" ? "var(--mdc-theme-primary)" : "white"
            }}
        />
    );
};

export const Brand = () => {
    return (
        <Fragment>
            <Compose component={BrandRenderer} with={BrandImpl} />
            <AddLogo logo={<WebinyLogo />} />
        </Fragment>
    );
};
