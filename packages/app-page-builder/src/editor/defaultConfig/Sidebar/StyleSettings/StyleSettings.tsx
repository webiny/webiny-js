import React from "react";
import { ReactComponent as WarningIcon } from "@material-design-icons/svg/round/warning.svg";
import useElementStyleSettings from "~/editor/plugins/elementSettings/hooks/useElementStyleSettings";
import { InfoMessage } from "~/editor/defaultConfig/Sidebar/InfoMessage";

export const StyleSettings = () => {
    const elementStyleSettings = useElementStyleSettings();

    return (
        <>
            {elementStyleSettings.length ? (
                elementStyleSettings.map(({ plugin, options }, index) => {
                    return React.cloneElement(plugin.render({ options }), {
                        key: index,
                        defaultAccordionValue: index === 0
                    });
                })
            ) : (
                <InfoMessage
                    icon={<WarningIcon />}
                    message={"No style settings found for selected element."}
                />
            )}
        </>
    );
};
