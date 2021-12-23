import React from "react";
import {
    Compose,
    BrandRenderer,
    BrandRendererProps,
    HigherOrderComponent
} from "@webiny/app-admin";
import { ReactComponent as Logo } from "./webiny-logo.svg";
import { TopAppBarTitle } from "@webiny/ui/TopAppBar";
import { Link } from "@webiny/react-router/";

const BrandImpl: HigherOrderComponent<BrandRendererProps> = () => {
    return function BrandRenderer({ location }) {
        return (
            <TopAppBarTitle>
                <Link to={"/"}>
                    <Logo
                        style={{
                            width: 100,
                            marginTop: 8,
                            height: 30,
                            color: location === "drawer" ? "var(--mdc-theme-primary)" : "white"
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
