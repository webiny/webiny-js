"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.serveApp = exports.buildApp = exports.developApp = exports.spa = undefined;

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let developApp = (exports.developApp = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function*(projectRoot, appRoot) {
        const UrlGenerator = interopModule(
            yield _promise2.default.resolve().then(() => require("./spa/urlGenerator"))
        );
        const urlGenerator = new UrlGenerator();

        const server = interopModule(
            yield _promise2.default
                .resolve()
                .then(() => require(`${_findUp2.default.sync(["server.js"], { cwd: appRoot })}`))
        );
        const baseWebpack = interopModule(
            yield _promise2.default.resolve().then(() => require("./spa/webpack.config"))
        )({
            projectRoot,
            appRoot,
            urlGenerator
        });

        const appWebpack = interopModule(
            yield _promise2.default
                .resolve()
                .then(() =>
                    require(`${_findUp2.default.sync(["webpack.config.js"], { cwd: appRoot })}`)
                )
        )({
            urlGenerator,
            config: baseWebpack
        });

        const browserSync = yield server;
        browserSync({ config: appWebpack, projectRoot, appRoot });
    });

    return function developApp(_x, _x2) {
        return _ref.apply(this, arguments);
    };
})());

let buildApp = (exports.buildApp = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function*(projectRoot, appRoot) {
        const UrlGenerator = interopModule(
            yield _promise2.default.resolve().then(() => require("./spa/urlGenerator"))
        );
        const urlGenerator = new UrlGenerator();

        const baseWebpack = interopModule(
            yield _promise2.default.resolve().then(() => require("./spa/webpack.config"))
        )({
            projectRoot,
            appRoot,
            urlGenerator
        });

        const appWebpack = interopModule(
            yield _promise2.default
                .resolve()
                .then(() =>
                    require(`${_findUp2.default.sync(["webpack.config.js"], { cwd: appRoot })}`)
                )
        )({
            config: baseWebpack,
            urlGenerator
        });

        const webpack = yield _promise2.default.resolve().then(() => require("webpack"));
        webpack(appWebpack).run(function(err, stats) {
            if (err) console.error(err);

            console.log(stats.toString({ colors: true }));
        });
    });

    return function buildApp(_x3, _x4) {
        return _ref2.apply(this, arguments);
    };
})());

let serveApp = (exports.serveApp = (() => {
    var _ref3 = (0, _asyncToGenerator3.default)(function*(projectRoot, appRoot) {
        const server = interopModule(
            yield _promise2.default
                .resolve()
                .then(() => require(`${_findUp2.default.sync(["server.js"], { cwd: appRoot })}`))
        );
        server({ projectRoot, appRoot });
    });

    return function serveApp(_x5, _x6) {
        return _ref3.apply(this, arguments);
    };
})());

var _findUp = require("find-up");

var _findUp2 = _interopRequireDefault(_findUp);

var _spa = require("./spa");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const interopModule = m => (m.default ? m.default : m);

const spa = (exports.spa = {
    appEntry: _spa.appEntry,
    SpaConfigPlugin: _spa.SpaConfigPlugin,
    server: _spa.server
});
//# sourceMappingURL=index.js.map
