import path from "path";

export default (args, configuration) => {
    if (args.url) {
        return args.url;
    }

    const websiteUrl = args?.configuration?.website.url || configuration?.website?.url;
    return path.join(websiteUrl, args.path);
};
