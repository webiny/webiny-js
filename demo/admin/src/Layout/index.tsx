import React from "react";
import { Navigation, Brand, useTags, Dashboard } from "@webiny/app-serverless-cms";
import { useTenancy } from "@webiny/app-tenancy";
import { Link } from "@webiny/react-router";
import { Dashboard as ArticlesDashboard } from "../Dashboard/Dashboard";
import { ReactComponent as LogoIcon } from "./webiny-logo.svg";

const HideNavigation = Navigation.createDecorator(Original => {
    return function Navigation() {
        const { tenant } = useTenancy();

        if (tenant !== "root") {
            return null;
        }

        return <Original />;
    };
});

const StyledLogo = () => {
    const { location } = useTags();
    const isLoginScreen = location === "loginScreen";
    const isAppBar = location === "appBar";
    const inApp = !isLoginScreen;

    const color = isAppBar ? "white" : "var(--mdc-theme-primary)";

    return (
        <LogoIcon
            style={{
                width: !inApp ? 125 : 100,
                height: !inApp ? "auto" : 30,
                paddingLeft: !inApp ? 0 : 20,
                color
            }}
        />
    );
};

const CustomLogo = () => {
    const { location } = useTags();
    const inApp = ["appBar", "navigation"].includes(String(location));

    if (!inApp) {
        return <StyledLogo />;
    }

    return (
        <Link to={"/"}>
            <StyledLogo />
        </Link>
    );
};

const BrandDecorator = Brand.createDecorator(Original => {
    return function Brand() {
        const { tenant } = useTenancy();

        if (tenant !== "root") {
            return <CustomLogo />;
        }

        return <Original />;
    };
});

const ReplaceDashboard = Dashboard.createDecorator(Original => {
    return function NewDashboard() {
        const { tenant } = useTenancy();

        if (tenant === "root") {
            return <Original />;
        }

        return <ArticlesDashboard />;
    };
});

export const Layout = () => {
    return (
        <>
            <HideNavigation />
            <BrandDecorator />
            <ReplaceDashboard />
        </>
    );
};
