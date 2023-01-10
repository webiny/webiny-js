import React, { useCallback } from "react";
import { makeComposable } from "@webiny/app-serverless-cms";
import { CircularProgress } from "@webiny/ui/Progress";
import { alignCenter, Title } from "~/components/StyledComponents";
import { Typography } from "@webiny/ui/Typography";
import { ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { ReactComponent as Auth0Icon } from "~/assets/icons/auth0-icon.svg";
import { useAuth0 } from "@auth0/auth0-react";

export const LoginContent = makeComposable("LoginContent", () => {
    const { isAuthenticated, loginWithRedirect } = useAuth0();

    const login = useCallback(() => {
        loginWithRedirect();
    }, []);

    return (
        <>
            {isAuthenticated ? (
                <CircularProgress label={"Logging in..."} />
            ) : (
                <>
                    <Title>
                        <Typography tag={"h1"} use={"headline4"}>
                            Sign In
                        </Typography>
                    </Title>
                    <div className={alignCenter}>
                        <Typography use={"body1"}>
                            You will be taken to Auth0 website to complete
                            <br />
                            the sign in process.
                        </Typography>
                    </div>
                    <div className={alignCenter} style={{ marginTop: 20 }}>
                        <ButtonPrimary onClick={login}>
                            <ButtonIcon icon={<Auth0Icon />} />
                            Sign in via Auth0
                        </ButtonPrimary>
                    </div>
                </>
            )}
        </>
    );
});
