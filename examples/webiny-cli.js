/**
 * This file contains....
 */

const DevelopPlugin = require('webiny-cli/lib/plugins/Develop');
const BuildPlugin = require('webiny-cli/lib/plugins/Build');

module.exports = {
    plugins: [
        new DevelopPlugin({
            routes: {
                '/admin': 'admin.html',
                '/': 'frontend.html'
            }
        }),
        new BuildPlugin()
    ]
};