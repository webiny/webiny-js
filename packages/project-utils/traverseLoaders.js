/**
 * A utility to recursively traverse loaders and execute the "onLoader" callback.
 */
const traverseLoaders = (loaders, onLoader) => {
    for (const loader of loaders) {
        if (loader.oneOf) {
            traverseLoaders(loader.oneOf, onLoader);
        } else if (loader.use) {
            traverseLoaders(loader.use, onLoader);
        } else {
            onLoader(loader);
        }
    }
};

module.exports = { traverseLoaders };
