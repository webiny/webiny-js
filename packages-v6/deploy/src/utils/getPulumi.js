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
exports.getPulumi = void 0;
var chalk_1 = require("chalk");
var ora_1 = require("ora");
var merge_1 = require("lodash/merge");
var pulumi_sdk_v6_1 = require("@webiny/pulumi-sdk-v6");
var cli_1 = require("@webiny/cli");
var getPulumi = function (args, options) {
    if (args === void 0) { args = {}; }
    if (options === void 0) { options = {}; }
    return __awaiter(void 0, void 0, void 0, function () {
        var context, spinner, pulumi;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, cli_1.useContext)()];
                case 1:
                    context = _a.sent();
                    spinner = (0, ora_1["default"])();
                    pulumi = new pulumi_sdk_v6_1.Pulumi((0, merge_1["default"])({
                        pulumiFolder: context.resolve(".webiny"),
                        beforePulumiInstall: function () {
                            console.log("It looks like this is your first time using ".concat((0, chalk_1.green)("@webiny/pulumi-sdk-v6"), "."));
                            spinner.start("Downloading Pulumi...");
                        },
                        afterPulumiInstall: function () {
                            spinner.stopAndPersist({
                                symbol: (0, chalk_1.green)("✔"),
                                text: "Pulumi downloaded, continuing..."
                            });
                        }
                    }, args));
                    if (!(options.install !== false)) return [3 /*break*/, 3];
                    return [4 /*yield*/, pulumi.install()];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, pulumi];
            }
        });
    });
};
exports.getPulumi = getPulumi;
