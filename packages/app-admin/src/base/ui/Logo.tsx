import React, { useMemo } from "react";
import { Compose, makeComposable } from "@webiny/app";

export const Logo = makeComposable("Logo", () => {
    return <LogoRenderer />;
});

export const LogoRenderer = makeComposable("LogoRenderer");

interface AddLogoProps {
    logo: JSX.Element;
}

export const AddLogo: React.FC<AddLogoProps> = ({ logo }) => {
    const LogoHOC = useMemo(() => {
        return () => {
            return function Logo() {
                return logo;
            };
        };
    }, []);

    return <Compose component={LogoRenderer} with={LogoHOC} />;
};
