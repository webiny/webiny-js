import React, { useEffect } from "react";
import { Amplify } from "aws-amplify";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import { ConsoleLinkPlugin } from "@webiny/app/plugins/ConsoleLinkPlugin";
import { GenericComponent } from "@webiny/app";
import { Decorator } from "@webiny/app-website";
import { SecurityProvider } from "@webiny/app-security/contexts/Security";
import { useSecurity } from "@webiny/app-security";
import { plugins } from "@webiny/plugins";
import { createApolloLinkPlugin } from "./createApolloLinkPlugin";
import { LoginScreen } from "./Login/LoginScreen";
import { ContentSettings } from "./ContentSettings";

Amplify.configure({
    Auth: {
        region: process.env.REACT_APP_WEBSITE_USER_POOL_REGION,
        userPoolId: process.env.REACT_APP_WEBSITE_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_WEBSITE_USER_POOL_CLIENT
    }
});

const LoginIdentity: React.FC = ({ children }) => {
    const { authStatus, user, signOut } = useAuthenticator(context => [
        context.user,
        context.authStatus
    ]);
    const { identity, setIdentity } = useWebsiteSecurity();

    // Handle changes of `authState`
    useEffect(() => {
        if (authStatus === "authenticated" && user) {
            setIdentity({
                id: user.username!,
                displayName: `${user.attributes?.given_name} ${user.attributes?.family_name}`,
                type: "employee",
                logout() {
                    setIdentity(null);
                    signOut();
                }
            });
        } else {
            setIdentity(null);
        }
    }, [authStatus, user]);

    return identity ? <>{children}</> : <LoginScreen />;
};

export function useWebsiteSecurity() {
    return useSecurity();
}

export const configureWebsiteSecurity = (): Decorator<
    GenericComponent<{ children: React.ReactNode }>
> => {
    return Original => {
        return function WebsiteSecurity({ children }) {
            plugins.register(new ConsoleLinkPlugin(), createApolloLinkPlugin());

            return (
                <>
                    <SecurityProvider>
                        <Authenticator.Provider>
                            <LoginIdentity>
                                <ContentSettings>
                                    <Original>{children}</Original>
                                </ContentSettings>
                            </LoginIdentity>
                        </Authenticator.Provider>
                    </SecurityProvider>
                </>
            );
        };
    };
};
