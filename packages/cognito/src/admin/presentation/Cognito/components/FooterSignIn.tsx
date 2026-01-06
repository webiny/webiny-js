import React from "react";
import { Link, Text } from "@webiny/admin-ui";

interface FooterSignInProps {
    onSignIn: () => void;
}

export const FooterSignIn = ({ onSignIn }: FooterSignInProps) => {
    return (
        <Text as={"div"} size={"sm"}>
            Want to sign in?&nbsp;
            <Link to="#" onClick={onSignIn}>
                Sign in
            </Link>
            .
        </Text>
    );
};
