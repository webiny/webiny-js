const defaults = {
    configuration: {
        meta: {
            cloudfront: {
                distributionId: "xyz"
            }
        },
        db: {
            namespace: "T#root"
        },
        storage: {
            name: "s3-bucket-name",
            folder: "test-folder"
        }
    }
};

type File = {
    name: string;
    type: string;
    meta: { tags: Array<{ key: string; value: string }> } & Record<string, any>;
};

type Entry = Record<string, any> & {
    PK: string;
    SK: string;
    TYPE: string;
    url: string;
    files: File[];
};

export default function (args): Entry {
    return {
        PK: "T#root#PS#RENDER",
        SK: args.url,
        TYPE: "ps.render",
        url: args.url,
        args: {
            url: args.url,
            configuration: args.configuration || defaults.configuration
        },
        files: args.files
    };
}
