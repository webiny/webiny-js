import load from "load-src";

const prepareParams = params => {
    const prepared = { content: {}, ...params };

    if (!prepared.content.href) {
        prepared.showLink = false;
    }

    if (!prepared.content.dismiss) {
        delete prepared.content.dismiss;
    }

    if (!prepared.content.message) {
        delete prepared.content.message;
    }

    return prepared;
};

let initialized = false;
const showCookiePolicy = async (params: any, previewMode = false) => {
    if (!previewMode) {
        if (initialized) {
            return;
        }

        initialized = true;
    }

    await load(
        "//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.css",
        "//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js"
    );

    // @ts-ignore
    window.cookieconsent.initialise(prepareParams(params));
};

export default showCookiePolicy;
