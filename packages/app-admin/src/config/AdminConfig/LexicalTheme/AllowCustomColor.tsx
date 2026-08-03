import React from "react";
import { ConnectToProperties, Property } from "@webiny/react-properties";

export interface AllowCustomColorProps {
    /**
     * When false the rich-text colour picker offers only the theme's colours and hides the free
     * colour wheel. This is how a theme's policy reaches the toolbar.
     */
    value: boolean;
}

export const AllowCustomColor = ({ value }: AllowCustomColorProps) => {
    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property id={"lexicalTheme"} name={"lexicalTheme"}>
                <Property
                    id={"lexicalTheme.allowCustomColor"}
                    name={"allowCustomColor"}
                    value={value}
                />
            </Property>
        </ConnectToProperties>
    );
};
