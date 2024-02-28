import { Auth } from "@aws-amplify/auth";

export const getToken = async (): Promise<string | null> => {
    const user = await Auth.currentSession();
    if (!user) {
        return null;
    }
    const token = user.getIdToken();
    if (!token) {
        return null;
    }
    return token.getJwtToken();
};
