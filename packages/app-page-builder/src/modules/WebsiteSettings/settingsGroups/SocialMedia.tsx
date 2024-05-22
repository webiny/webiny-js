import React from "react";
import { Bind } from "@webiny/form";
import { WebsiteSettingsConfig } from "~/modules/WebsiteSettings/config/WebsiteSettingsConfig";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";

const { Group, Element } = WebsiteSettingsConfig;

export const SocialMedia = () => {
    return (
        <WebsiteSettingsConfig>
            <Group name={"socialMedia"} label={"Social Media"}>
                <Element
                    name={"facebook"}
                    element={
                        <Bind name={"social.facebook"} validators={validation.create("url")}>
                            <Input label="Facebook" />
                        </Bind>
                    }
                />
                <Element
                    name={"twitter"}
                    element={
                        <Bind name={"social.twitter"} validators={validation.create("url")}>
                            <Input label="Twitter" />
                        </Bind>
                    }
                />
                <Element
                    name={"instagram"}
                    element={
                        <Bind name={"social.instagram"} validators={validation.create("url")}>
                            <Input label="Instagram" />
                        </Bind>
                    }
                />
                <Element
                    name={"linkedIn"}
                    element={
                        <Bind name={"social.instagram"} validators={validation.create("url")}>
                            <Input label="Instagram" />
                        </Bind>
                    }
                />
                <Element
                    name={"openGraphImage"}
                    element={
                        <Bind name={"social.image"}>
                            <SingleImageUpload
                                label="Default Open Graph image"
                                description={`The default OG image for all pages. Recommended resolution 1596x545.`}
                            />
                        </Bind>
                    }
                />
            </Group>
        </WebsiteSettingsConfig>
    );
};
