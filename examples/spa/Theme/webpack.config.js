const path = require('path');

module.exports = ({ config, env }) => {
    config.output.path = path.join(__dirname, '/../dist', env, 'themes/default');

    return config;
};