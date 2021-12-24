import React, { useCallback } from "react";
import { Compose, BrandRenderer, HigherOrderComponent, useTags } from "@webiny/app-admin";
import { ReactComponent as Logo } from "./webiny-logo.svg";
import { TopAppBarTitle } from "@webiny/ui/TopAppBar";
import { Link } from "@webiny/react-router/";
import { useNavigation } from "../Navigation";

const BrandImpl: HigherOrderComponent = () => {
    return function BrandRenderer() {
        const { location } = useTags();
        const { setVisible } = useNavigation();

        const onClick = useCallback(() => {
            location === "navigation" ? setVisible(false) : null;
        }, []);

        return (
            <TopAppBarTitle>
                <Link to={"/"} onClick={onClick}>
                    <Logo
                        style={{
                            width: 100,
                            marginTop: 8,
                            height: 30,
                            color: location === "navigation" ? "var(--mdc-theme-primary)" : "white"
                        }}
                    />
                </Link>
            </TopAppBarTitle>
        );
    };
};

export const Brand = () => {
    return <Compose component={BrandRenderer} with={BrandImpl} />;
};
