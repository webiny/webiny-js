import React from "react";
import { AdminConfig, RegisterFeature } from "webiny/admin";
import { AdminLayout } from "webiny/admin/ui";
import { Route, useRouter } from "webiny/admin/router";
import { WebLlmFeature } from "./feature.js";
import { WebLlmAutoLoader } from "./WebLlmAutoLoader.js";
import { ChatPage } from "./ChatPage.js";

const { Menu, Route: ConfigRoute } = AdminConfig;

const ChatRoute = new Route({ name: "WebLlm/Chat", path: "/chat" });

const WebLlmConfig = () => {
    const { getLink } = useRouter();

    return (
        <AdminConfig>
            <ConfigRoute
                route={ChatRoute}
                element={
                    <AdminLayout title={"WebLLM Chat"}>
                        <ChatPage />
                    </AdminLayout>
                }
            />
            <Menu
                parent={"settings.system"}
                name={"webLlmChat"}
                element={<Menu.Link text={"WebLLM Chat"} to={getLink(ChatRoute)} pinnable={true} />}
            />
        </AdminConfig>
    );
};

export default () => {
    return (
        <>
            <RegisterFeature feature={WebLlmFeature} />
            <WebLlmAutoLoader />
            <WebLlmConfig />
        </>
    );
};
