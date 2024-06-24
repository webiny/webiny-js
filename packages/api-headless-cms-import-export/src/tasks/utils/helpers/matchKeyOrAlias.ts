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
        const isAlias = !pathname.startsWith("/files/") && !pathname.startsWith("/private/");
        if (isAlias) {
            return {
                alias: pathname
            };
        }
        return {
            key: pathname.replace("/files/", "").replace("/private/", "")
        };
    } catch (ex) {
        if (process.env.DEBUG === "true") {
            console.error(`Url ${input} is not valid.`);
        }
        return null;
    }
};
