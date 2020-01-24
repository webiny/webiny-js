module.exports = function({ template }) {
    return {
        visitor: {
            Program(path) {
                const lastImport = path
                    .get("body")
                    .filter(p => p.isImportDeclaration())
                    .pop();

                lastImport.insertAfter(template(`import "source-map-support/register";`)());
            }
        }
    };
};
