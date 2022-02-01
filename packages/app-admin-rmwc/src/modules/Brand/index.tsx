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
    const isLoginScreen = location === "loginScreen";
    const isAppBar = location === "appBar";

    const color = isAppBar ? "white" : "var(--mdc-theme-primary)";

    return (
        <LogoIcon
            style={{
                width: isLoginScreen ? 125 : 100,
                height: isLoginScreen ? "auto" : 30,
                paddingLeft: isLoginScreen ? 0 : 20,
                color
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
