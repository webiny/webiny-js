import React, { useMemo } from "react";
import { Compose, createVoidComponent, makeDecoratable } from "@webiny/app";

export const Logo = makeDecoratable("Logo", () => {
    return <LogoRenderer />;
});

export const LogoRenderer = makeDecoratable("LogoRenderer", createVoidComponent());

interface AddLogoProps {
    logo: JSX.Element;
}

export const AddLogo = ({ logo }: AddLogoProps) => {
    const LogoHOC = useMemo(() => {
        return () => {
            return function Logo() {
                return logo;
            };
        };
    }, []);

    return <Compose component={LogoRenderer} with={LogoHOC} />;
};
