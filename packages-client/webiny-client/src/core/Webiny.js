import React from 'react';
import _ from 'lodash';
import 'babel-polyfill';
import Page from './Lib/Core/Page';
import isElementOfType from './Lib/isElementOfType';

class Webiny {
    constructor() {
        this.Apps = {};
        this.Config = {};
        this.EMPTY = '__webiny_empty__';
        this.Page = new Page();
        this.onRenderCallbacks = [];
        this.firstRenderDone = false;

        if (DEVELOPMENT) {
            this.hotReloading = false;
            this.isHotReloading = () => this.hotReloading;
            this.refresh = () => {
                this.hotReloading = true;
                this.app && this.app.setState({ts: new Date().getTime()}, () => {
                    this.hotReloading = false;
                });
            }
        }
    }

    import(modules, options = {}) {
        return this.ModuleLoader.load(modules, options);
    }

    importByTag(tag) {
        return this.ModuleLoader.loadByTag(tag);
    }

    registerModule(...modules) {
        modules.map(m => this.ModuleLoader.setModule(m));
        return this;
    }

    configureModule(name, config) {
        this.ModuleLoader.setConfiguration(name, config);
    }

    /**
     * Check if given element's class has the given flag defined in its options
     *
     * @param element
     * @param flag
     */
    elementHasFlag(element, flag) {
        if (React.isValidElement(element)) {
            return _.get(element.type, 'options.' + flag, false);
        }

        return false;
    }

    isElementOfType(element, type) {
        return isElementOfType(element, type);
    }

    setModuleLoader(loader) {
        this.ModuleLoader = loader;
    }
}

export default new Webiny();