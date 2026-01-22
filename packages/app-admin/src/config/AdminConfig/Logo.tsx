import React from "react";
import { makeDecoratable } from "~/index.js";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface LogoProps {
    squareLogo: React.ReactNode;
    horizontalLogo?: React.ReactNode;
}

const BaseLogo = ({ squareLogo, horizontalLogo }: LogoProps) => {
    const getId = useIdGenerator("Logo");

    return (
        <>
            <Property id={getId("squareLogo")} name={"squareLogo"} value={squareLogo} />
            <Property
                id={getId("horizontalLogo")}
                name={"horizontalLogo"}
                value={horizontalLogo ?? squareLogo}
            />
        </>
    );
};

export const Logo = makeDecoratable("Logo", BaseLogo);
