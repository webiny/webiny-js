const { createApiWebpackConfig } = require("@webiny/cli");

module.exports = {
    // ovako bi mogli forwardati parametre iz SLS templatea?
    async webpack({ watch = false }) { // mozda ovo zvati ne-webpack ?
        const { execute, webpackConfig } = await createApiWebpackConfig({ watch });
        return await execute(webpackConfig);

        // return await buildApi({
        //     webpack(config) {
        //         return config;
        //     },
        //     babel(config) {
        //         return config;
        //     }
        // });
    }
};

// Workflow je malo retardiran:
// 1) webiny deploy api --watch
// 2) lerna run watch --scope=@webiny/api-* --stream --parallel
// 3) za pojedini servis jos: yarn build:watch ???

// Ako napravimo na ovaj gore nacin (da se `watch` moze forwardati),
// onda bi izbjegli ovu trecu naredbu
