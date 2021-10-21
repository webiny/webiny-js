import { Render } from "~/types";

const defaults = {
    configuration: {
        meta: {
            cloudfront: {
                distributionId: "xyz"
            }
        },
        db: {
            namespace: "root"
        },
        storage: {
            name: "s3-bucket-name",
            folder: "test-folder"
        }
    }
};

export default function (args): Render {
    return {
        namespace: args.namespace,
        url: args.url,
        args: {
            url: args.url,
            configuration: args.configuration || defaults.configuration
        },
        files: args.files
    };
}
