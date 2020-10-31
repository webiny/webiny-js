import React, { useCallback, useMemo, useState } from "react";
import { ApolloProvider } from "react-apollo";
import { UiProvider } from "@webiny/app/contexts/Ui";
import { Routes } from "@webiny/app/components/Routes";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import { SecurityProvider } from "@webiny/app-security";
import { CircularProgress } from "@webiny/ui/Progress";
import { AppInstaller } from "@webiny/app-admin/components/AppInstaller";
import { CmsProvider } from "@webiny/app-headless-cms/admin/contexts/Cms";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { BrowserRouter } from "@webiny/react-router";
import { Authentication } from "@webiny/app-plugin-security-cognito/Authentication";
import { createApolloClient } from "./components/apolloClient";
import { NetworkError } from "./components/NetworkError";
import { getIdentityData } from "./components/getIdentityData";
import { plugins } from "@webiny/plugins";

// Import styles which include custom theme styles
import "./App.scss";
import { RichTextEditor } from "@webiny/ui/RichTextEditor";
import { FileManager } from "@webiny/app-admin/components";

const defaultValue = [
    {
        type: "image",
        data: {
            file: {
                id: "5f9bf55a3524420008bcbff5",
                name: "8kgw5rpyq-0_0NSNjtscV90y_E44.jpg",
                key: "8kgw5rpyq-0_0NSNjtscV90y_E44.jpg",
                src: "//d11b161qaqa3gz.cloudfront.net/files/8kgw5rpyq-0_0NSNjtscV90y_E44.jpg",
                size: 147442,
                type: "image/jpeg"
            },
            caption: "",
            withBorder: false,
            stretched: true,
            withBackground: false
        }
    },
    {
        type: "paragraph",
        data: {
            text:
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam auctor porttitor lorem in tempus. Integer ut vestibulum quam. Fusce maximus risus in justo feugiat placerat. Pellentesque enim ex, interdum et viverra rutrum, mollis eu mauris. Nunc sapien libero, porttitor ut nisi ut, maximus placerat turpis. Phasellus nunc tortor, elementum et ullamcorper ut, interdum id elit. Phasellus sed tortor erat. Mauris vehicula condimentum tortor, mollis interdum lacus tempor id. Ut rutrum efficitur venenatis. Curabitur condimentum diam et mauris luctus ultricies quis vitae quam. Nullam vitae augue odio. Aenean sollicitudin mi tempor ipsum vestibulum pretium. Maecenas tempus eleifend varius. Maecenas iaculis congue lorem, ac euismod erat venenatis at."
        }
    },
    {
        type: "paragraph",
        data: {
            text:
                "Praesent id facilisis mauris. Phasellus id ante vel lectus euismod consectetur. In laoreet varius justo, eu scelerisque enim. Aliquam auctor lacinia maximus. Sed faucibus et velit nec sagittis. Curabitur non ante ex. Nulla quis neque nisi."
        }
    }
];

export const App = () => {
    const onChange = useCallback(data => {
        setValue(data);
    }, []);

    const tools = useMemo(() => {
        return plugins.byType("rich-text-editor-tool").reduce((tools, pl) => {
            tools[pl.toolName] = pl.tool;
            return tools;
        }, {});
    }, []);

    const [value, setValue] = useState(defaultValue);

    return (
        <ApolloProvider client={createApolloClient()}>
            {/* 
            <SecurityProvider> is a generic provider of identity information. 3rd party identity providers (like Cognito,
            Okta, Auth0) will handle the authentication, and set the information about the user into this provider,
            so other parts of the system have a centralized place to fetch user information from. 
        */}
            <SecurityProvider>
                {/* 
                    <NetworkError> renders network error information when there are problems communicating with your GraphQL API. 
                */}
                <NetworkError>
                    {/* 
                        <BrowserRouter> is an enhanced version of "react-router" to add some capabilities specific to Webiny.
                    */}
                    <BrowserRouter basename={process.env.PUBLIC_URL}>
                        {/* 
                            <UiProvider> is a centralized state handler for UI related things. When you need to render
                            dialogs, snackbars, handle dark mode, you can use the "useUi()" hook to set/unset UI information
                            without losing the state on route transitions. 
                            NOTE: we do not recommend using this provider for you application data, it's just a helper state
                            manager to handle UI easier.    
                        */}
                        <UiProvider>
                            <Authentication getIdentityData={getIdentityData}>
                                <FileManager>
                                    {({ showFileManager }) => (
                                        <RichTextEditor
                                            placeholder={"Enter some text..."}
                                            value={value}
                                            onChange={onChange}
                                            showFileManager={showFileManager}
                                            tools={tools}
                                        />
                                    )}
                                </FileManager>
                            </Authentication>
                        </UiProvider>
                    </BrowserRouter>
                </NetworkError>
            </SecurityProvider>
        </ApolloProvider>
    );
};
