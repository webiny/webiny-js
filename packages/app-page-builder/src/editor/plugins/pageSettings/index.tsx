import * as React from "react";
import { gql } from "graphql-tag";
import get from "lodash/get";
import { PluginCollection } from "@webiny/plugins/types";
import { AddQuerySelectionPlugin } from "@webiny/app/plugins/AddQuerySelectionPlugin";
import { ReactComponent as SettingsIcon } from "./icons/round-settings-24px.svg";
import { ReactComponent as SocialIcon } from "./icons/round-thumb_up-24px.svg";
import { ReactComponent as SeoIcon } from "./icons/round-search-24px.svg";
import { GeneralSettingsView } from "~/editor/ui/views/GeneralSettingsView";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { PageSettingsView } from "~/editor/ui/views/PageSettingsView";
import { SocialSettingsView } from "~/editor/ui/views/SocialSettingsView";
import { FileManagerElement } from "@webiny/app-admin/ui/elements/form/FileManagerElement";
import appendOgImageDimensions from "./appendOgImageDimensions";
import { HiddenElement } from "@webiny/app-admin/ui/elements/form/HiddenElement";
import { SEOSettingsView } from "~/editor/ui/views/SEOSettingsView";
import { PageBuilderFormDataFileItem, PageBuilderFormDataSettings } from "~/types";

const plugins: PluginCollection = [
    new UIViewPlugin<PageSettingsView>(PageSettingsView, view => {
        view.addSection({
            id: "general",
            title: "General settings",
            description: "Manage things like title, page status, path, and more.",
            icon: <SettingsIcon />,
            view: new GeneralSettingsView()
        });

        view.addSection({
            id: "seo",
            title: "SEO",
            description: "Control SEO settings like page title, description, and keywords.",
            icon: <SeoIcon />,
            view: new SEOSettingsView()
        });

        view.addSection({
            id: "social",
            title: "Social media",
            description: "Set share images and settings for social media websites.",
            icon: <SocialIcon />,
            view: new SocialSettingsView()
        });
    }),
    /**
     * When image is changed in General settings, generate OG image tags in Social Media settings.
     */
    new UIViewPlugin<GeneralSettingsView>(GeneralSettingsView, view => {
        const image = view.getElement<FileManagerElement>("image");
        if (!image) {
            return;
        }

        const ogImageTags = new HiddenElement("socialMeta", { name: "settings.social.meta" });
        ogImageTags.moveToTheEndOf(view.getFormContentElement());

        image.addAfterChange<PageBuilderFormDataFileItem, PageBuilderFormDataSettings>(
            (value, form) => {
                const src = get(form.data, "settings.social.image.src");

                const hasOgImage = typeof src === "string" && src && !src.startsWith("data:");

                // If not already set, set selectedImage as og:image too.
                if (value && !hasOgImage) {
                    appendOgImageDimensions({
                        data: form.data,
                        value,
                        setValue: form.setValue
                    });
                }
            }
        );
    }),
    new AddQuerySelectionPlugin({
        operationName: "PbGetPage",
        selectionPath: "pageBuilder.getPage.data",
        addSelection: gql`
            {
                settings {
                    general {
                        snippet
                        image {
                            id
                            src
                        }
                        tags
                        layout
                    }
                }
            }
        `
    }),
    new AddQuerySelectionPlugin({
        operationName: "PbGetPage",
        selectionPath: "pageBuilder.getPage.data",
        addSelection: gql`
            {
                settings {
                    seo {
                        title
                        description
                        meta {
                            name
                            content
                        }
                    }
                }
            }
        `
    }),
    new AddQuerySelectionPlugin({
        operationName: "PbGetPage",
        selectionPath: "pageBuilder.getPage.data",
        addSelection: gql`
            {
                settings {
                    social {
                        image {
                            id
                            src
                        }
                        title
                        description
                        meta {
                            property
                            content
                        }
                    }
                }
            }
        `
    })
];

export default plugins;
