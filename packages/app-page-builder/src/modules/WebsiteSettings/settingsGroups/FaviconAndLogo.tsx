import React from "react";
import { Bind } from "@webiny/form";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { WebsiteSettingsConfig } from "~/modules/WebsiteSettings/config/WebsiteSettingsConfig";

const { Group, Element } = WebsiteSettingsConfig;

export const FaviconAndLogo = () => {
    return (
        <WebsiteSettingsConfig>
            <Group name={"faviconAndLogo"} label={"Favicon and Logo"}>
                <Element
                    name={"favicon"}
                    element={
                        <Bind name={"favicon"}>
                            <SingleImageUpload
                                label="Favicon"
                                accept={["image/png", "image/x-icon", "image/vnd.microsoft.icon"]}
                                imagePreviewProps={{
                                    style: { height: 91 }
                                }}
                                description={
                                    <span>
                                        Supported file types: <strong>.png</strong> and{" "}
                                        <strong>.ico</strong> .
                                    </span>
                                }
                            />
                        </Bind>
                    }
                />
                <Element
                    name={"logo"}
                    element={
                        <Bind name={"logo"}>
                            <SingleImageUpload label="Logo" />
                        </Bind>
                    }
                />
            </Group>
        </WebsiteSettingsConfig>
    );
};
