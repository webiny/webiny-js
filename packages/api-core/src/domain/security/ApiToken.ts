export class ApiToken {
    /**
     * Validate that the token is valid.
     * @param token
     */
    static validate(token: string): `wat_${string}` {
        if (!token.startsWith("wat_")) {
            throw Error("Invalid token! A valid token starts with 'wat_'.");
        }

        return token as `wat_${string}`;
    }
}
