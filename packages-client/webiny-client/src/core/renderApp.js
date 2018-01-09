import Webiny from './index';
import React from 'react';
import ReactDOM from 'react-dom';

let initialized = false;

function init(global) {
    initialized = true;
    // import Core vendors
    require('console-polyfill');
    const jquery = require('jquery');
    const Promise = require('bluebird/js/browser/bluebird.core.js');

    global['webinyVendor'] = {
        'jquery': require('jquery'),
        'react': require('react'),
        'react-dom': require('react-dom'),
        'webiny-client': require('webiny-client'),
        'lodash/get': require('lodash/get'),
        'lodash/set': require('lodash/set'),
        'lodash/has': require('lodash/has'),
        'lodash/map': require('lodash/map'),
        'lodash/each': require('lodash/each'),
        'lodash/forEach': require('lodash/forEach'),
        'lodash/find': require('lodash/find'),
        'lodash/isArray': require('lodash/isArray'),
        'lodash/isString': require('lodash/isString'),
        'lodash/isFunction': require('lodash/isFunction'),
        'lodash/isObject': require('lodash/isObject'),
        'lodash/isPlainObject': require('lodash/isPlainObject'),
        'lodash/isEqual': require('lodash/isEqual'),
        'lodash/pick': require('lodash/pick'),
        'lodash/omit': require('lodash/omit'),
        'lodash/assign': require('lodash/assign'),
        'lodash/merge': require('lodash/merge'),
        'lodash/findIndex': require('lodash/findIndex'),
        'lodash/uniqueId': require('lodash/uniqueId'),
        'lodash/filter': require('lodash/filter'),
        'lodash/noop': require('lodash/noop'),
        'lodash/clone': require('lodash/clone'),
        'lodash/cloneDeep': require('lodash/cloneDeep'),
        'lodash/keys': require('lodash/keys'),
        'lodash/values': require('lodash/values'),
        'lodash/trimEnd': require('lodash/trimEnd'),
        'lodash/trimStart': require('lodash/trimStart')
    };

    global.Promise = Promise;
    global.$ = global.jQuery = jquery;
    Promise.config({
        cancellation: true,
        warnings: {
            wForgottenReturn: false
        }
    });

    global['webinyOnRender'] = (callback) => {
        Webiny.onRenderCallbacks.push(callback);
    };

    global['webinyFirstRenderDone'] = () => {
        return Webiny.firstRenderDone;
    };

    require('bootstrap-sass');

    if (DEVELOPMENT) {
        global['$Webiny'] = Webiny;
    }

    // Check if `Webiny` config exists in the global
    if (!global.webinyConfig) {
        console.error('You must define a "webinyConfig" to bootstrap your app!');
    }
    Webiny.Config = webinyConfig;
}

export default async ({app, root, module, beforeRender}) => {
    if (!initialized) {
        init(window);

        // Run Webiny
        await Webiny.I18n.init();

        if (Webiny.Auth) {
            Webiny.Auth.init();
        }

        await app.run();
    }

    if (DEVELOPMENT) {
        if (module.hot) {
            // Accept update and suppress errors
            module.hot.accept(() => {
            });
            let lastStatus = 'idle';
            module.hot.addStatusHandler(status => {
                if (lastStatus === 'apply' && status === 'idle') {
                    console.info('[WEBINY] Re-render...');
                    Webiny.refresh();
                }
                lastStatus = status;
            });
        }
    }

    const onDidUpdate = () => {
        Webiny.firstRenderDone = true;
        Webiny.onRenderCallbacks.map(cb => cb());
    };

    if (typeof beforeRender !== 'function') {
        beforeRender = () => Promise.resolve();
    }

    await beforeRender();

    return Webiny.app = ReactDOM.render(<Webiny.Ui.RootElement onDidUpdate={onDidUpdate}/>, root);
};