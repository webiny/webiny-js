import React from "react";
import { Bind } from "@webiny/form";
import { AddPbWebsiteSettings } from "../AddPbWebsiteSettings";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";

const { Group, Element } = AddPbWebsiteSettings;

export const FaviconAndLogo = () => {
    return (
        <Group name={"faviconAndLogo"} label={"Favicon and Logo"}>
            <Element>
                <Bind name={"favicon"}>
                    <SingleImageUpload
                        onChangePick={["id", "src"]}
                        label="Favicon"
                        accept={["image/png", "image/x-icon", "image/vnd.microsoft.icon"]}
                        description={
                            <span>
                                Supported file types: <strong>.png</strong> and{" "}
                                <strong>.ico</strong> .
                            </span>
                        }
                    />
                </Bind>
            </Element>
            <Element>
                <Bind name={"logo"}>
                    <SingleImageUpload label="Logo" onChangePick={["id", "src"]} />
                </Bind>
            </Element>
        </Group>
    );
};
