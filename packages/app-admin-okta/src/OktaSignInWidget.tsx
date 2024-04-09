import React, { useEffect, useRef } from "react";
import { useOktaAuth } from "@okta/okta-react";
import OktaSignIn from "@okta/okta-signin-widget";
import styled from "@emotion/styled";

interface OktaSignInWidgetProps {
    oktaSignIn: OktaSignIn;
}

export const Wrapper = styled("section")({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: "100vh",
    color: "var(--mdc-theme-on-surface)",
    "#okta-sign-in": {
        marginTop: 0
    }
});

export const LoginContent = styled("div")({
    width: "100%",
    maxWidth: 500,
    margin: "0 auto 25px auto"
});

const OktaSignInWidget = ({ oktaSignIn }: OktaSignInWidgetProps) => {
    const { oktaAuth } = useOktaAuth();
    const widgetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!widgetRef.current) {
            return undefined;
        }

        const query = new URLSearchParams(location.search);
        const initiateAuthFlow = Boolean(query.get("iss"));
        if (initiateAuthFlow) {
            oktaAuth.token.getWithRedirect({
                responseType: "id_token"
            });
        } else {
            oktaSignIn.renderEl(
                {
                    /**
                     * TODO @ts-refactor figure out correct widgetRef type @pavel
                     */
                    // @ts-expect-error
                    el: widgetRef.current
                },
                res => {
                    oktaAuth.handleLoginRedirect(res.tokens);
                },
                err => {
                    throw err;
                }
            );
        }

        return () => oktaSignIn.remove();
    }, [oktaAuth]);

    return (
        <Wrapper>
            <LoginContent ref={widgetRef} />
        </Wrapper>
    );
};
export default OktaSignInWidget;
