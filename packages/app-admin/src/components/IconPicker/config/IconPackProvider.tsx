import React from "react";
import { Property } from "@webiny/react-properties";

import { Icon, IconConfig } from "./Icon";

export type IconPackProviderProps = {
    provider: () => IconConfig[];
};

export const IconPackProvider = ({ provider }: IconPackProviderProps) => {
    const icons = provider();

    return (
        <Property id="iconPackProvider" name={"iconPackProvider"}>
            {icons.map((icon, index) => (
                <Icon key={index} {...icon} />
            ))}
        </Property>
    );
};
