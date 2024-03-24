import React from "react";
import styled from "@emotion/styled";
import { ReactComponent as WarningIcon } from "@material-design-icons/svg/round/warning.svg";
import { useElementStyleSettings } from "~/editor/plugins/elementSettings/hooks/useElementStyleSettings";
import { InfoMessage } from "~/editor/defaultConfig/Sidebar/InfoMessage";
import { StyleSettingsPlugin } from "~/editor/config/Sidebar/StyleSettingsPlugin";

const IfNoSiblings = styled.div`
    display: none;
    :only-child {
        display: block;
    }
`;

export const StyleSettings = () => {
    const elementStyleSettings = useElementStyleSettings();

    return (
        <>
            {elementStyleSettings.map(({ plugin, options }, index) => {
                return (
                    <StyleSettingsPlugin plugin={plugin} key={plugin.name}>
                        {React.cloneElement(plugin.render({ options }), {
                            defaultAccordionValue: index === 0
                        })}
                    </StyleSettingsPlugin>
                );
            })}
            <IfNoSiblings>
                <InfoMessage
                    icon={<WarningIcon />}
                    message={"No style settings were found for the selected element."}
                />
            </IfNoSiblings>
        </>
    );
};
