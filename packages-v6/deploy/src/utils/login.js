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
exports.login = void 0;
var fs_1 = require("fs");
var getPulumi_1 = require("./getPulumi");
var trimEnd_1 = require("lodash/trimEnd");
var cli_1 = require("@webiny/cli");
// To use a self-managed backend, specify a storage endpoint URL as pulumi login’s <backend-url> argument:
// s3://<bucket-path>, azblob://<container-path>, gs://<bucket-path>, or file://<fs-path>.
// This will tell Pulumi to store state in AWS S3, Azure Blob Storage, Google Cloud Storage, or the
// local filesystem, respectively.
// @see https://www.pulumi.com/docs/intro/concepts/state/#logging-into-the-pulumi-service-backend
var SELF_MANAGED_BACKEND = ["s3://", "azblob://", "gs://"];
var login = function (appName) { return __awaiter(void 0, void 0, void 0, function () {
    var context, pulumi, login, selfManagedBackend, stateFilesFolder;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, cli_1.useContext)()];
            case 1:
                context = _a.sent();
                return [4 /*yield*/, (0, getPulumi_1.getPulumi)()];
            case 2:
                pulumi = _a.sent();
                login = process.env.WEBINY_PULUMI_BACKEND ||
                    process.env.WEBINY_PULUMI_BACKEND_URL ||
                    process.env.PULUMI_LOGIN;
                if (login) {
                    selfManagedBackend = SELF_MANAGED_BACKEND.find(function (item) { return login.startsWith(item); });
                    if (selfManagedBackend) {
                        login = (0, trimEnd_1["default"])(login, "/") + "/" + appName;
                        login = login.replace(/\\/g, "/");
                    }
                }
                else {
                    stateFilesFolder = context.resolve(".pulumi", appName);
                    if (!fs_1["default"].existsSync(stateFilesFolder)) {
                        fs_1["default"].mkdirSync(stateFilesFolder, { recursive: true });
                    }
                    login = "file://".concat(stateFilesFolder);
                }
                return [4 /*yield*/, pulumi.run({
                        command: ["login", login]
                    })];
            case 3:
                _a.sent();
                return [2 /*return*/, { login: login }];
        }
    });
}); };
exports.login = login;
