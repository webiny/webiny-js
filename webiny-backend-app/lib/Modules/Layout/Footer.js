"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Footer = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(Footer, _Webiny$Ui$Component);

    function Footer(props) {
        (0, _classCallCheck3.default)(this, Footer);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Footer.__proto__ || Object.getPrototypeOf(Footer)).call(this, props)
        );

        _this.state = {
            developerMode: false,
            links: [
                {
                    name: "Webiny 2.0",
                    url: "http://www.webiny.com/"
                    /* {
                 name: 'Legal',
                 url: '#'
                 },
                 {
                 name: 'Copyright',
                 url: '#'
                 },
                 {
                 name: 'Support',
                 url: '#'
                 } */
                }
            ],
            linksSecondary: [
                /* {
                 name: 'Help',
                 url: '#'
                 },
                 {
                 name: 'Documentation',
                 url: '#'
                 },
                 {
                 name: 'GitHub',
                 url: '#'
                 } */
            ]
        };
        return _this;
    }

    (0, _createClass3.default)(Footer, [
        {
            key: "renderLink",
            value: function renderLink(item, key) {
                return _react2.default.createElement(
                    "li",
                    { key: key },
                    _react2.default.createElement(
                        "a",
                        { href: item.url, target: "_blank" },
                        item.name
                    )
                );
            }
        }
    ]);
    return Footer;
})(_webinyClient.Webiny.Ui.Component);

Footer.defaultProps = {
    renderer: function renderer() {
        return false;

        /*
        return (
            <footer>
                <ul className="links">
                    {this.state.links.map(this.renderLink)}
                </ul>
                <ul className="links secondary">
                    {this.state.linksSecondary.map(this.renderLink)}
                </ul>
                <div className="dropdown sort feedback-wrap">
                    <button className="btn btn-default dropdown-toggle feedback" type="button">
                        <span className="icon icon-comments"></span>
                        <span>HELP US WITH FEEDBACK</span>
                    </button>
                </div>
            </footer>
        );
        */
    }
};

exports.default = Footer;
//# sourceMappingURL=Footer.js.map
