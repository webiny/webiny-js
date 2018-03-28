"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _orderBy2 = require("lodash/orderBy");

var _orderBy3 = _interopRequireDefault(_orderBy2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _filter2 = require("lodash/filter");

var _filter3 = _interopRequireDefault(_filter2);

var _isEmpty2 = require("lodash/isEmpty");

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _BaseContainer = require("./BaseContainer");

var _BaseContainer2 = _interopRequireDefault(_BaseContainer);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

// TODO: not finished!

var StaticContainer = (function(_React$Component) {
    (0, _inherits3.default)(StaticContainer, _React$Component);

    function StaticContainer() {
        (0, _classCallCheck3.default)(this, StaticContainer);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (StaticContainer.__proto__ || Object.getPrototypeOf(StaticContainer)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(StaticContainer, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                this.loadData(this.props);
            }
        },
        {
            key: "componentWillReceiveProps",
            value: (function() {
                var _ref = (0, _asyncToGenerator3.default)(
                    /*#__PURE__*/ _regenerator2.default.mark(function _callee(props) {
                        return _regenerator2.default.wrap(
                            function _callee$(_context) {
                                while (1) {
                                    switch ((_context.prev = _context.next)) {
                                        case 0:
                                            if (
                                                !(0, _isEqual3.default)(props.data, this.props.data)
                                            ) {
                                                _context.next = 2;
                                                break;
                                            }

                                            return _context.abrupt("return");

                                        case 2:
                                            _context.next = 4;
                                            return this.prepare(props);

                                        case 4:
                                            this.loadData(props);

                                        case 5:
                                        case "end":
                                            return _context.stop();
                                    }
                                }
                            },
                            _callee,
                            this
                        );
                    })
                );

                function componentWillReceiveProps(_x) {
                    return _ref.apply(this, arguments);
                }

                return componentWillReceiveProps;
            })()
        },
        {
            key: "loadData",
            value: function loadData(props) {
                var _this2 = this;

                var propsData = (0, _get3.default)(props, "data", this.props.data);
                var data = (0, _isEmpty3.default)(this.props.filters)
                    ? propsData
                    : (0, _filter3.default)(propsData, this.props.filters);
                var fields = [];
                var order = [];
                var sorters = Object.keys(this.props.sorters).length
                    ? this.props.sorters
                    : this.props.initialSorters;
                (0, _each3.default)(sorters, function(sort, field) {
                    fields.push(field);
                    order.push(sort === 1 ? "asc" : "desc");
                });
                data = (0, _orderBy3.default)(data, fields, order);

                var meta = {
                    currentPage: this.props.page,
                    perPage: this.props.perPage,
                    totalCount: data.length,
                    totalPages: Math.ceil(data.length / this.props.perPage)
                };

                this.totalPages = meta.totalPages;

                var from = (this.props.page - 1) * this.props.perPage;
                var newState = (0, _assign3.default)({
                    list: data.slice(from, from + this.props.perPage),
                    meta: meta,
                    selectedRows: []
                });

                return new Promise(function(resolve) {
                    return _this2.setState(newState, resolve);
                });
            }
        }
    ]);
    return StaticContainer;
})(_react2.default.Component);

StaticContainer.defaultProps = {
    connectToRouter: false,
    page: 1,
    perPage: 10,
    layout: function layout(_ref2) {
        var filters = _ref2.filters,
            table = _ref2.table,
            pagination = _ref2.pagination;

        return _react2.default.createElement(
            "webiny-list-layout",
            null,
            filters,
            table,
            pagination
        );
    }
};

exports.default = (0, _webinyApp.createComponent)([StaticContainer, _BaseContainer2.default]);
//# sourceMappingURL=StaticContainer.js.map
