export interface CognitoIdToken {
    idToken: string;
    payload: Record<string, any>;
    logout?: () => void;
}

export interface Authenticator {
    (): Promise<CognitoIdToken>;
}
