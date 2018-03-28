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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _isEmpty2 = require("lodash/isEmpty");

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _webinyApp = require("webiny-app");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

// TODO: https://www.npmjs.com/package/react-google-maps

var GoogleMap = (function(_React$Component) {
    (0, _inherits3.default)(GoogleMap, _React$Component);

    function GoogleMap(props) {
        (0, _classCallCheck3.default)(this, GoogleMap);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (GoogleMap.__proto__ || Object.getPrototypeOf(GoogleMap)).call(this, props)
        );

        _this.state = Object.assign({}, props.initialState);

        _this.dom = null;
        _this.map = null;
        _this.marker = null;
        _this.geoCoder = null;
        _this.loading = null;

        ["positionMarker", "setupMap", "search"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(GoogleMap, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this2 = this;

                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }

                if (!window.google) {
                    return _webinyApp.document
                        .loadScript(
                            "https://maps.googleapis.com/maps/api/js?key=" + this.props.apiKey
                        )
                        .then(function() {
                            _this2.setupMap();
                        });
                }

                if (this.props.onReady) {
                    this.props.onReady({
                        search: this.search,
                        positionMarker: this.positionMarker
                    });
                }

                this.setupMap();
            }
        },
        {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate(newProps) {
                if (!newProps.value) {
                    return false;
                }

                return !(0, _isEqual3.default)(this.props.value, newProps.value);
            }
        },
        {
            key: "componentDidUpdate",
            value: function componentDidUpdate() {
                if (!this.map) {
                    return;
                }

                this.positionMarker();
            }
        },
        {
            key: "setupMap",
            value: function setupMap() {
                var _this3 = this;

                var lat = (0, _get3.default)(this.props, "value.lat", this.props.center.lat);
                var lng = (0, _get3.default)(this.props, "value.lng", this.props.center.lng);

                this.map = new google.maps.Map(this.dom, {
                    center: new google.maps.LatLng(parseFloat(lat), parseFloat(lng)),
                    zoom: this.props.zoom,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                });

                this.marker = new google.maps.Marker({
                    map: this.map,
                    draggable: true
                });

                if (!this.props.readOnly) {
                    google.maps.event.addListener(this.marker, "dragend", function() {
                        _this3.props.onChange({
                            lat: _this3.marker.getPosition().lat(),
                            lng: _this3.marker.getPosition().lng()
                        });
                    });
                }

                this.positionMarker();
            }
        },
        {
            key: "positionMarker",
            value: function positionMarker() {
                var lat = (0, _get3.default)(this.props, "value.lat");
                var lng = (0, _get3.default)(this.props, "value.lng");

                if (lat && lng) {
                    var latLng = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
                    this.map.panTo(latLng);
                    this.marker.setMap(this.map);
                    this.marker.setPosition(latLng);
                }
            }
        },
        {
            key: "search",
            value: function search(query) {
                var _this4 = this;

                if (!this.geoCoder) {
                    this.geoCoder = new google.maps.Geocoder();
                }

                this.geoCoder.geocode({ address: query }, function(results) {
                    if (!(0, _isEmpty3.default)(results)) {
                        var location = (0, _get3.default)(results[0], "geometry.location");
                        _this4.props.onChange({
                            lat: location.lat(),
                            lng: location.lng()
                        });
                    }
                });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this5 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var styles = this.props.styles;

                return _react2.default.createElement(
                    "div",
                    { className: styles.container, style: this.props.style },
                    _react2.default.createElement(
                        "div",
                        {
                            ref: function ref(_ref) {
                                return (_this5.dom = _ref);
                            },
                            className: styles.map
                        },
                        this.props.children
                    )
                );
            }
        }
    ]);
    return GoogleMap;
})(_react2.default.Component);

GoogleMap.defaultProps = {
    apiKey: null,
    zoom: 4,
    center: {
        lat: 0,
        lng: 0
    },
    readOnly: false,
    style: null,
    value: null,
    onChange: _noop3.default
};

exports.default = (0, _webinyApp.createComponent)([GoogleMap, _webinyApp.FormComponent], {
    styles: _styles2.default,
    formComponent: true
});
//# sourceMappingURL=index.js.map
