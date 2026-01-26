import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Button, OverlayLoader } from "webiny/admin/ui";
import { useFeature } from "webiny/admin";
import type { ITokens } from "../features/CustomIdp/abstractions.js";
import { CustomIdpFeature } from "../features/CustomIdp/feature.js";
import { Container, Content, Title } from "./View.js";

interface CustomIdpViewProps {
    children: React.ReactNode;
}

function getTokensFromUrl(): ITokens | undefined {
    const data = new URLSearchParams(window.location.search);
    const idToken = data.get("idToken") ?? undefined;
    const refreshToken = data.get("refreshToken") ?? undefined;

    const url = new URL(window.location.href);
    url.searchParams.delete("idToken");
    url.searchParams.delete("refreshToken");

    window.history.replaceState({}, document.title, url.toString());

    if (!idToken || !refreshToken) {
        return undefined;
    }

    return { idToken, refreshToken };
}

export const LoginScreen = observer(({ children }: CustomIdpViewProps) => {
    const { presenter } = useFeature(CustomIdpFeature);

    useEffect(() => {
        const tokens = getTokensFromUrl();
        presenter.init(tokens);

        return () => {
            presenter.destroy();
        };
    }, [presenter]);

    const vm = presenter.vm;

    const isRefreshing = vm.isRefreshing;
    const isIdpAuthenticated = vm.isIdpAuthenticated;
    const isWebinyAuthenticated = vm.isWebinyAuthenticated;

    // Show children only when both IDP and Webiny are authenticated
    if (isIdpAuthenticated && isWebinyAuthenticated) {
        return <>{children}</>;
    }

    return (
        <>
            {vm.isRefreshing ? <OverlayLoader text={"Checking user session..."} /> : null}
            {!isIdpAuthenticated && !isRefreshing ? (
                <Container>
                    <Content>
                        <Title
                            title={"Sign In"}
                            description={
                                "You will be taken to an external website to complete the sign in process."
                            }
                        />

                        <div className={"flex w-full"}>
                            <Button
                                variant={"primary"}
                                className={"w-full"}
                                containerClassName={"w-full"}
                                onClick={() => presenter.login()}
                                text={"Sign in"}
                            />
                        </div>
                    </Content>
                </Container>
            ) : null}
        </>
    );
});
