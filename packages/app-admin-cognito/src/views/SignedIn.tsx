import React from "react";
import { useSignedIn } from "@webiny/app-cognito-authenticator/hooks/useSignedIn";

interface SignedInProps {
    children: React.ReactNode;
}

const SignedIn: React.FC<SignedInProps> = ({ children }) => {
    const { shouldRender } = useSignedIn();

    return shouldRender ? (children as unknown as React.ReactElement) : null;
};

export default SignedIn;
