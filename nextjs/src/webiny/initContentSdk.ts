import {
    contentSdk,
    registerComponentGroup,
    type ComponentManifest
} from "@webiny/website-builder-react";

interface InitContentSdkOptions {
    preview?: boolean;
    apiKey?: string;
}

export const initContentSdk = (options: InitContentSdkOptions = {}) => {
    const previewMode = options.preview === true && !contentSdk.isEditing();

    contentSdk.init(
        {
            apiKey: options.apiKey ?? String(process.env.NEXT_PUBLIC_WEBSITE_BUILDER_API_KEY),
            preview: previewMode ?? false
        },
        () => {
            registerComponentGroup({
                name: "basic",
                label: "Basic",
                description: "Components for simple content creation"
            });

            registerComponentGroup({
                name: "custom",
                label: "Custom",
                description: "Assorted custom components",
                filter: (component: ComponentManifest) => !component.group
            });
        }
    );
};
