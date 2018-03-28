"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _findIndex2 = require("lodash/findIndex");

var _findIndex3 = _interopRequireDefault(_findIndex2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Uploader = (function() {
    function Uploader(api) {
        (0, _classCallCheck3.default)(this, Uploader);

        this.api = api;
        this.pending = [];
        this.inProgress = null;
        this.request = null;
        this.cancelRequest = null;
    }

    (0, _createClass3.default)(Uploader, [
        {
            key: "getQueue",
            value: function getQueue() {
                return this.pending;
            }
        },
        {
            key: "upload",
            value: function upload(file) {
                var progress =
                    arguments.length > 1 && arguments[1] !== undefined
                        ? arguments[1]
                        : _noop3.default;
                var done =
                    arguments.length > 2 && arguments[2] !== undefined
                        ? arguments[2]
                        : _noop3.default;
                var error =
                    arguments.length > 3 && arguments[3] !== undefined
                        ? arguments[3]
                        : _noop3.default;

                if (!progress) {
                    progress = _noop3.default;
                }
                var id = (0, _uniqueId3.default)("file-upload-");
                this.pending.push({
                    id: id,
                    file: file,
                    progress: progress,
                    done: done,
                    error: error
                });
                this.process();
                return id;
            }
        },
        {
            key: "abort",
            value: function abort(id) {
                if (this.inProgress && this.inProgress.id === id) {
                    this.request.cancel();
                }
                this.pending.splice((0, _findIndex3.default)(this.pending, { id: id }), 1);
            }
        },
        {
            key: "isInProgress",
            value: function isInProgress(id) {
                return this.inProgress && this.inProgress.id === id;
            }
        },
        {
            key: "process",
            value: function process() {
                var _this = this;

                if (this.inProgress || !this.pending.length) {
                    return;
                }

                this.inProgress = this.pending.shift();

                var image = this.inProgress.file;
                var done = this.inProgress.done;
                var error = this.inProgress.error || _noop3.default;

                var uploadDone = function uploadDone(response) {
                    var jobId = _this.inProgress.id;
                    _this.inProgress = null;
                    if (!response.code) {
                        done({ file: response.data.data, response: response });
                    } else {
                        error({ response: response.data, image: image, jobId: jobId });
                    }
                    _this.process();
                };

                var method = image.id ? "patch" : "post";
                var url = image.id || "/";

                this.request = this.api[method](url, {
                    data: image,
                    onUploadProgress: function onUploadProgress(pe) {
                        var percentage = Math.round(pe.loaded / pe.total * 100);
                        _this.inProgress.progress({ event: pe, percentage: percentage });
                    },
                    cancelToken: new _axios2.default.CancelToken(function(cancel) {
                        _this.cancelRequest = cancel;
                    })
                })
                    .then(uploadDone)
                    .catch(function(err) {
                        return _axios2.default.isCancel(err) ? null : err.response.data;
                    });
            }
        }
    ]);
    return Uploader;
})();

exports.default = Uploader;
//# sourceMappingURL=Uploader.js.map
