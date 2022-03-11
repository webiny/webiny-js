"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var cli_1 = require("@webiny/cli");
var pulumi_sdk_v6_1 = require("@webiny/pulumi-sdk-v6");
var login_1 = require("./utils/login");
var getPulumi_1 = require("./utils/getPulumi");
var application_1 = require("./application");
var tagResources_1 = require("./tagResources");
exports["default"] = (function (_a) {
    var preview = _a.preview;
    return __awaiter(void 0, void 0, void 0, function () {
        var context, pulumi, config, env, deployConfig, onResource, tagResources, api, pulumiPlugins, _loop_1, _i, pulumiPlugins_1, plugin, pulumiApp, stack;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, cli_1.useContext)()];
                case 1:
                    context = _b.sent();
                    return [4 /*yield*/, (0, login_1.login)("api")];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, getPulumi_1.getPulumi)()];
                case 3:
                    pulumi = _b.sent();
                    config = context.getConfig();
                    env = context.getEnv();
                    deployConfig = config.deploy ? config.deploy(env) : {};
                    onResource = function (resource) {
                        if (typeof deployConfig.resourceName === "function") {
                            resource.name = deployConfig.resourceName(resource.name);
                        }
                    };
                    tagResources = function () { return (0, tagResources_1.tagResources)(deployConfig.resourceTags || {}); };
                    api = (0, application_1.createAPIApplication)({ onResource: onResource, tagResources: tagResources });
                    pulumiPlugins = context.getPlugins().filter(function (pl) { return pl.pulumi !== undefined; });
                    _loop_1 = function (plugin) {
                        var applyPulumiConfig;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require(plugin.pulumi); }).then(function (m) {
                                        return m["default"](plugin.__options);
                                    })];
                                case 1:
                                    applyPulumiConfig = _c.sent();
                                    return [4 /*yield*/, applyPulumiConfig({ api: api })];
                                case 2:
                                    _c.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, pulumiPlugins_1 = pulumiPlugins;
                    _b.label = 4;
                case 4:
                    if (!(_i < pulumiPlugins_1.length)) return [3 /*break*/, 7];
                    plugin = pulumiPlugins_1[_i];
                    return [5 /*yield**/, _loop_1(plugin)];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    pulumiApp = (0, pulumi_sdk_v6_1.createGenericApplication)({
                        id: "api",
                        name: "API",
                        app: api
                    });
                    return [4 /*yield*/, pulumiApp.createOrSelectStack({
                            root: context.resolve(),
                            env: context.getEnv(),
                            pulumi: pulumi
                        })];
                case 8:
                    stack = _b.sent();
                    if (!preview) return [3 /*break*/, 10];
                    return [4 /*yield*/, stack.preview()];
                case 9:
                    _b.sent();
                    return [3 /*break*/, 12];
                case 10: return [4 /*yield*/, stack.up()];
                case 11:
                    _b.sent();
                    _b.label = 12;
                case 12: return [2 /*return*/];
            }
        });
    });
});
