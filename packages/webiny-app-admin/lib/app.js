"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _menu = require("./services/menu");

var _menu2 = _interopRequireDefault(_menu);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = function() {
    return function(params, next) {
        Promise.all([
            new Promise(function(res) {
                return (0, _webinyAppUi.app)()(params, res);
            })
        ]).then(function() {
            _webinyApp.app.services.add("menu", function() {
                return new _menu2.default();
            });

            _webinyApp.app.modules.register([
                {
                    name: "Skeleton.AdminLayout",
                    factory: function factory() {
                        return import("./components/Layouts/AdminLayout");
                    }
                },
                {
                    name: "Skeleton.EmptyLayout",
                    factory: function factory() {
                        return import("./components/Layouts/EmptyLayout");
                    }
                },
                {
                    name: "Skeleton.Header",
                    factory: function factory() {
                        return import("./components/Header");
                    }
                },
                {
                    name: "Skeleton.Footer",
                    factory: function factory() {
                        return import("./components/Footer");
                    }
                },
                {
                    name: "Skeleton.Logo",
                    factory: function factory() {
                        return import("./components/Logo");
                    },
                    tags: ["header-component"]
                },
                {
                    name: "Skeleton.Navigation",
                    factory: function factory() {
                        return import("./components/Navigation");
                    }
                },
                {
                    name: "Skeleton.Navigation.Desktop",
                    factory: function factory() {
                        return import("./components/Navigation/Desktop");
                    }
                },
                {
                    name: "Skeleton.Navigation.Mobile",
                    factory: function factory() {
                        return import("./components/Navigation/Mobile");
                    }
                }
            ]);

            next();
        });
    };
};
//# sourceMappingURL=app.js.map
