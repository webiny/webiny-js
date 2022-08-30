import React from "react";
import styled from "@emotion/styled";
import NoActiveElement from "./NoActiveElement";
import { ReactComponent as TouchIcon } from "./icons/touch_app.svg";
import { ReactComponent as WarningIcon } from "./icons/warning-black.svg";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import useElementStyleSettings from "~/editor/plugins/elementSettings/hooks/useElementStyleSettings";
import { ButtonPrimary } from "@webiny/ui/Button";
import UnlinkBlockAction from "~/editor/plugins/elementSettings/unlinkBlock/UnlinkBlockAction";
import { ReactComponent as InfoIcon } from "@webiny/app-admin/assets/icons/info.svg";

const RootElement = styled("div")({
    height: "calc(100vh - 65px - 48px)", // Subtract top-bar and tab-header height
    overflowY: "auto",
    // Style scrollbar
    "&::-webkit-scrollbar": {
        width: 1
    },
    "&::-webkit-scrollbar-track": {
        boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.3)"
    },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: "darkgrey",
        outline: "1px solid slategrey"
    }
});

const UnlinkBlockWrapper = styled("div")({
    padding: "16px",
    display: "grid",
    rowGap: "16px",
    justifyContent: "center",
    alignItems: "center",
    margin: "16px",
    textAlign: "center",
    backgroundColor: "var(--mdc-theme-background)",
    border: "3px dashed var(--webiny-theme-color-border)",
    borderRadius: "5px",
    "& .info-wrapper": {
        display: "flex",
        alignItems: "center",
        fontSize: "10px",
        "& svg": {
            width: "18px",
            marginRight: "5px"
        }
    }
});

const StyleSettingsTabContent: React.FC = () => {
    const [element] = useActiveElement();
    const elementStyleSettings = useElementStyleSettings();

    if (!element) {
        return (
            <NoActiveElement
                icon={<TouchIcon />}
                message={"Select an element on the canvas to activate this panel."}
            />
        );
    }

    if (element.type === "block" && element.data?.blockId) {
        return (
            <UnlinkBlockWrapper>
                This is a block element - to change it you need to unlink it first. By unlinking it,
                any changes made to the block will no longer automatically reflect to this page.
                <div>
                    <UnlinkBlockAction>
                        <ButtonPrimary>Unlink block</ButtonPrimary>
                    </UnlinkBlockAction>
                </div>
                <div className="info-wrapper">
                    <InfoIcon /> Click here to learn more about how block work
                </div>
            </UnlinkBlockWrapper>
        );
    }

    return (
        <RootElement>
            {elementStyleSettings.length ? (
                elementStyleSettings.map(({ plugin, options }, index) => {
                    return React.cloneElement(plugin.render({ options }), {
                        key: index,
                        defaultAccordionValue: index === 0
                    });
                })
            ) : (
                <NoActiveElement
                    icon={<WarningIcon />}
                    message={"No style settings found for selected element."}
                />
            )}
        </RootElement>
    );
};

export default React.memo(StyleSettingsTabContent);
