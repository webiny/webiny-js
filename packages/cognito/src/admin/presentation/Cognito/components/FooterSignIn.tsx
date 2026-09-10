import React from "react";
import { Link, Text } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/app-admin";

export interface FooterSignInProps {
    onSignIn: () => void;
}

export const FooterSignIn = makeDecoratable(
    "CognitoFooterSignIn",
    ({ onSignIn }: FooterSignInProps) => {
        return (
            <Text as={"div"} size={"sm"}>
                Want to sign in?&nbsp;
                <Link to="#" onClick={onSignIn}>
                    Sign in
                </Link>
                .
            </Text>
        );
    }
);
