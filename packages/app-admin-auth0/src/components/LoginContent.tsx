import React from "react";
import { makeDecoratable } from "@webiny/app-serverless-cms";
import { CircularProgress } from "@webiny/ui/Progress";
import { alignCenter, Title } from "~/components/StyledComponents";
import { Typography } from "@webiny/ui/Typography";
import { ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { ReactComponent as Auth0Icon } from "~/assets/icons/auth0-icon.svg";
import { useAuth0 } from "@auth0/auth0-react";

export interface LoginContentProps {
    isLoading: boolean;
    onLogin: () => void;
}

export const LoginContent = makeDecoratable(
    "LoginContent",
    ({ onLogin, isLoading }: LoginContentProps) => {
        const { isAuthenticated } = useAuth0();

        return (
            <>
                {isAuthenticated ? <CircularProgress label={"Logging in..."} /> : null}
                {!isAuthenticated && isLoading ? (
                    <CircularProgress label={"Checking user session..."} />
                ) : null}
                {!isAuthenticated && !isLoading ? (
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
                            <ButtonPrimary onClick={onLogin}>
                                <ButtonIcon icon={<Auth0Icon />} />
                                Sign in via Auth0
                            </ButtonPrimary>
                        </div>
                    </>
                ) : null}
            </>
        );
    }
);
