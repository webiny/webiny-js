interface IMatchOutput {
    alias?: never;
    key: string;
}

interface IMatchAliasOutput {
    key?: never;
    alias: string;
}

export const matchKeyOrAlias = (input: string): IMatchAliasOutput | IMatchOutput | null => {
    try {
        const url = new URL(input);
        const { pathname } = url;
        const isFiles = pathname.startsWith("/files/");
        const isPrivate = pathname.startsWith("/private/");
        if (!isFiles && !isPrivate) {
            return {
                alias: pathname
            };
        } else if (!isPrivate) {
            return {
                key: pathname.replace(/^\/files\//, "")
            };
        }
        return {
            key: pathname.replace(/^\/private\//, "")
        };
    } catch (ex) {
        if (process.env.DEBUG === "true") {
            console.error(`Url "${input}" is not valid.`);
            console.error(ex);
        }
        return null;
    }
};
