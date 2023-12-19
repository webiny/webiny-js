import React from "react";
import { Bind } from "@webiny/form";
import { AddPbWebsiteSettings } from "../AddPbWebsiteSettings";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";

const { Group, Element } = AddPbWebsiteSettings;

export const SocialMedia = () => {
    return (
        <Group name={"socialMedia"} label={"Social Media"}>
            <Element>
                <Bind name={"social.facebook"} validators={validation.create("url")}>
                    <Input label="Facebook" />
                </Bind>
            </Element>
            <Element>
                <Bind name={"social.twitter"} validators={validation.create("url")}>
                    <Input label="Twitter" />
                </Bind>
            </Element>
            <Element>
                <Bind name={"social.instagram"} validators={validation.create("url")}>
                    <Input label="Instagram" />
                </Bind>
            </Element>
            <Element>
                <Bind name={"social.linkedIn"} validators={validation.create("url")}>
                    <Input label="LinkedIn" />
                </Bind>
            </Element>
            <Element>
                <Bind name={"social.image"}>
                    <SingleImageUpload
                        label="Default Open Graph image"
                        description={`The default OG image for all pages. Recommended resolution 1596x545.`}
                    />
                </Bind>
            </Element>
        </Group>
    );
};
