import { useSignedIn } from "@webiny/app-security-cognito-authentication/hooks/useSignedIn";

const SignedIn = ({ children }) => {
    const { shouldRender } = useSignedIn();

    return shouldRender ? children : null;
};

export default SignedIn;
