import React from "react";
import { useSignedIn } from "@webiny/app-cognito-authenticator/hooks/useSignedIn";

const SignedIn: React.FC = ({ children }) => {
    const { shouldRender } = useSignedIn();

    return shouldRender ? (children as unknown as React.ReactElement) : null;
};

export default SignedIn;
