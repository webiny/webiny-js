import { useSignedIn } from "@webiny/app-cognito-authenticator/hooks/useSignedIn";

const SignedIn = ({ children }) => {
    const { shouldRender } = useSignedIn();

    return shouldRender ? children : null;
};

export default SignedIn;
