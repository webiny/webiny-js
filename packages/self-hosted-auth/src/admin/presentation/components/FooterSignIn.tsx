import React from "react";
import { Link } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/app-admin";

export interface FooterSignInProps {
    onSignIn: () => void;
}

/** The way back to sign-in, on every screen of the reset flow. Nobody should be stuck in it. */
export const FooterSignIn = makeDecoratable(
    "SelfHostedFooterSignIn",
    ({ onSignIn }: FooterSignInProps) => {
        return (
            <Text as={"div"} size={"sm"}>
                Want to sign in?&nbsp;
                <Link to={"#"} onClick={onSignIn} data-testid={"back-to-sign-in-link"}>
                    Sign in
                </Link>
                .
            </Text>
        );
    }
);
