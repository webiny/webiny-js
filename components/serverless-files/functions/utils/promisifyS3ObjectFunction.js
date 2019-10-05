/**
 * Promisifies s3 CRUD object functions, for easier use in processors.
 * Could not promisify using NodeJS "util.promisify" utility function, "this" is lost in the process.
 * @param s3
 * @param action
 * @returns {function({params?: *}): Promise<any>}
 */
module.exports = ({ s3, action }) => {
    return async ({ params }) => {
        return new Promise((resolve, reject) => {
            s3[action](params, function(err, data) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });
    };
};
