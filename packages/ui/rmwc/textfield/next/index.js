/* eslint-disable */
var __extends =
    (this && this.__extends) ||
    (function () {
        var extendStatics = function (d, b) {
            extendStatics =
                Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array &&
                    function (d, b) {
                        d.__proto__ = b;
                    }) ||
                function (d, b) {
                    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
                };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() {
                this.constructor = d;
            }
            d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
        };
    })();
var __assign =
    (this && this.__assign) ||
    function () {
        __assign =
            Object.assign ||
            function (t) {
                for (var s, i = 1, n = arguments.length; i < n; i++) {
                    s = arguments[i];
                    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                }
                return t;
            };
        return __assign.apply(this, arguments);
    };
var __rest =
    (this && this.__rest) ||
    function (s, e) {
        var t = {};
        for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    };
import * as React from "react";
import {
    MDCTextFieldFoundation,
    MDCTextFieldIconFoundation,
    MDCTextFieldCharacterCounterFoundation
} from "@material/textfield";
import { componentFactory, FoundationComponent, randomId, deprecationWarning } from "@rmwc/base";
import { Icon } from "@rmwc/icon";
import { LineRipple } from "@rmwc/line-ripple";
import { FloatingLabel } from "@rmwc/floating-label";
import { NotchedOutline } from "@rmwc/notched-outline";
import { withRipple } from "@rmwc/ripple";
var TextFieldRoot = withRipple()(
    componentFactory({
        displayName: "TextFieldRoot",
        deprecate: {
            box: ""
        },
        classNames: function (props) {
            return [
                "mdc-text-field",
                "mdc-text-field--upgraded",
                {
                    "mdc-text-field--textarea": props.textarea,
                    "mdc-text-field--fullwidth": props.fullwidth,
                    "mdc-text-field--outlined": props.outlined,
                    "mdc-text-field--dense": props.dense,
                    "mdc-text-field--invalid": props.invalid,
                    "mdc-text-field--disabled": props.disabled,
                    "mdc-text-field--with-leading-icon": !!props.icon,
                    "mdc-text-field--with-trailing-icon": !!props.trailingIcon,
                    "mdc-text-field--no-label": !props.label
                }
            ];
        },
        consumeProps: [
            "textarea",
            "fullwidth",
            "outlined",
            "dense",
            "invalid",
            "disabled",
            "icon",
            "trailingIcon",
            "label"
        ]
    })
);
var TextFieldInput = componentFactory({
    displayName: "TextFieldInput",
    defaultProps: {
        type: "text"
    },
    tag: "input",
    classNames: ["mdc-text-field__input"]
});
var TextFieldTextarea = componentFactory({
    displayName: "TextFieldTextarea",
    tag: "textarea",
    classNames: ["mdc-text-field__input"]
});
/** A TextField component for accepting text input from a user. */
var TextField = /** @class */ (function (_super) {
    __extends(TextField, _super);
    function TextField(props) {
        var _this = _super.call(this, props) || this;
        _this.generatedId = randomId("textfield");
        _this.root = _this.createElement("root");
        _this.input = _this.createElement("input");
        _this.label = _this.createElement("label");
        _this.lineRipple = _this.createElement("lineRipple");
        _this.characterCounter = null;
        _this.leadingIcon = null;
        _this.trailingIcon = null;
        _this.valueNeedsUpdate = false;
        _this.handleOnChange = _this.handleOnChange.bind(_this);
        return _this;
    }
    TextField.prototype.getDefaultFoundation = function () {
        var _this = this;
        return new MDCTextFieldFoundation(
            __assign(
                {
                    addClass: function (className) {
                        return _this.root.addClass(className);
                    },
                    removeClass: function (className) {
                        return _this.root.removeClass(className);
                    },
                    hasClass: function (className) {
                        return _this.root.hasClass(className);
                    },
                    registerTextFieldInteractionHandler: function (evtType, handler) {
                        return _this.root.addEventListener(evtType, handler);
                    },
                    deregisterTextFieldInteractionHandler: function (evtType, handler) {
                        return _this.root.removeEventListener(evtType, handler);
                    },
                    registerValidationAttributeChangeHandler: function (handler) {
                        var getAttributesList = function (mutationsList) {
                            return mutationsList.map(function (mutation) {
                                return mutation.attributeName;
                            });
                        };
                        if (_this.input.ref) {
                            var observer = new MutationObserver(function (mutationsList) {
                                return handler(getAttributesList(mutationsList));
                            });
                            var targetNode = _this.input.ref;
                            var config = { attributes: true };
                            targetNode && observer.observe(targetNode, config);
                            return observer;
                        }
                        return {};
                    },
                    deregisterValidationAttributeChangeHandler: function (observer) {
                        observer && observer.disconnect();
                    },
                    isFocused: function () {
                        return document.activeElement === _this.input.ref;
                    }
                },
                this.getInputAdapterMethods(),
                this.getLabelAdapterMethods(),
                this.getLineRippleAdapterMethods(),
                this.getOutlineAdapterMethods()
            ),
            this.getFoundationMap()
        );
    };
    TextField.prototype.getLabelAdapterMethods = function () {
        var _this = this;
        return {
            shakeLabel: function (shouldShake) {
                return _this.label.setProp("shake", shouldShake);
            },
            floatLabel: function (shouldFloat) {
                return _this.label.setProp("float", shouldFloat);
            },
            hasLabel: function () {
                return !!_this.props.label;
            },
            getLabelWidth: function () {
                return _this.label.ref ? _this.label.ref.getWidth() : 0;
            }
        };
    };
    TextField.prototype.getLineRippleAdapterMethods = function () {
        var _this = this;
        return {
            activateLineRipple: function () {
                if (_this.lineRipple) {
                    _this.lineRipple.setProp("active", true);
                }
            },
            deactivateLineRipple: function () {
                if (_this.lineRipple) {
                    _this.lineRipple.setProp("active", false);
                }
            },
            setLineRippleTransformOrigin: function (normalizedX) {
                if (_this.lineRipple) {
                    _this.lineRipple.setProp("center", normalizedX);
                }
            }
        };
    };
    TextField.prototype.getOutlineAdapterMethods = function () {
        var _this = this;
        return {
            notchOutline: function (labelWidth) {
                !!_this.outline && _this.outline.notch(labelWidth);
            },
            closeOutline: function () {
                return _this.outline && _this.outline.closeNotch();
            },
            hasOutline: function () {
                return !!_this.outline;
            }
        };
    };
    TextField.prototype.getInputAdapterMethods = function () {
        var _this = this;
        return {
            registerInputInteractionHandler: function (evtType, handler) {
                return _this.input.addEventListener(evtType, handler);
            },
            deregisterInputInteractionHandler: function (evtType, handler) {
                return _this.input.removeEventListener(evtType, handler);
            },
            getNativeInput: function () {
                return _this.input.ref;
            }
        };
    };
    TextField.prototype.getFoundationMap = function () {
        return {
            characterCounter: this.characterCounter ? this.characterCounter.foundation : undefined,
            helperText: undefined,
            leadingIcon: this.leadingIcon ? this.leadingIcon.foundation : undefined,
            trailingIcon: this.trailingIcon ? this.trailingIcon.foundation : undefined
        };
    };
    // handle leading and trailing icons
    TextField.prototype.renderIcon = function (icon, leadOrTrail) {
        var _this = this;
        return React.createElement(TextFieldIcon, {
            ref: function (ref) {
                if (leadOrTrail === "leadingIcon") {
                    _this.leadingIcon = ref;
                } else {
                    _this.trailingIcon = ref;
                }
            },
            tabIndex: leadOrTrail === "trailingIcon" ? 0 : undefined,
            icon: icon
        });
    };
    TextField.prototype.sync = function (props) {
        // Bug #362
        // see comments below in render function
        if (this.valueNeedsUpdate) {
            this.foundation.setValue(String(props.value));
            this.valueNeedsUpdate = false;
        }
    };
    TextField.prototype.handleOnChange = function (evt) {
        // this.props.onChange && this.props.onChange(evt);
        // this.setState({});
    };
    TextField.prototype.renderHelpText = function (renderedCharacterCounter) {
        var _a = this.props,
            helpText = _a.helpText,
            characterCount = _a.characterCount,
            textarea = _a.textarea;
        var shouldRender = !!helpText || (characterCount && !textarea);
        if (!shouldRender) {
            return null;
        }
        var shouldSpread = typeof helpText === "object" && !React.isValidElement(helpText);
        return React.createElement(
            "div",
            { className: "mdc-text-field-helper-line" },
            helpText && shouldSpread
                ? React.createElement(TextFieldHelperText, __assign({}, helpText))
                : React.createElement(TextFieldHelperText, null, helpText),
            !textarea && renderedCharacterCounter
        );
    };
    TextField.prototype.render = function () {
        var _this = this;
        var _a = this.props,
            label = _a.label,
            className = _a.className,
            style = _a.style,
            outlined = _a.outlined,
            fullwidth = _a.fullwidth,
            dense = _a.dense,
            invalid = _a.invalid,
            disabled = _a.disabled,
            helpText = _a.helpText,
            children = _a.children,
            textarea = _a.textarea,
            inputRef = _a.inputRef,
            characterCount = _a.characterCount,
            _icon = _a.icon,
            _trailingIcon = _a.trailingIcon,
            _withLeadingIcon = _a.withLeadingIcon,
            _withTrailingIcon = _a.withTrailingIcon,
            _b = _a.rootProps,
            rootProps = _b === void 0 ? {} : _b,
            rest = __rest(_a, [
                "label",
                "className",
                "style",
                "outlined",
                "fullwidth",
                "dense",
                "invalid",
                "disabled",
                "helpText",
                "children",
                "textarea",
                "inputRef",
                "characterCount",
                "icon",
                "trailingIcon",
                "withLeadingIcon",
                "withTrailingIcon",
                "rootProps"
            ]);
        var _c = this.props,
            icon = _c.icon,
            trailingIcon = _c.trailingIcon,
            withLeadingIcon = _c.withLeadingIcon,
            withTrailingIcon = _c.withTrailingIcon;
        if (dense !== undefined) {
            deprecationWarning(
                "Textfield prop 'dense' is being removed in a future release by material-components-web."
            );
        }
        if (withLeadingIcon !== undefined) {
            deprecationWarning("Textfield prop 'withLeadingIcon' is now 'icon'.");
            icon = withLeadingIcon;
        }
        if (withTrailingIcon !== undefined) {
            deprecationWarning("Textfield prop 'withTrailingIcon' is now 'trailingIcon'.");
            trailingIcon = withTrailingIcon;
        }
        // Fixes bug #362
        // MDC breaks Reacts unidirectional data flow...
        // we cant set the value on render, but we need to
        // to create the side effects for the UI when we dynamically update the field
        // Flag that it needs to be set so that we can call the foundation
        // on componentDidUpdate
        if (
            this.props.value !== undefined &&
            this.foundation &&
            this.props.value !== this.foundation.getValue()
        ) {
            this.valueNeedsUpdate = true;
        }
        var tagProps = __assign({}, this.input.props(rest), {
            disabled: disabled,
            ref: function (ref) {
                _this.input.setRef(ref);
                if (typeof inputRef === "function") {
                    inputRef && inputRef(ref);
                } else if (typeof inputRef === "object") {
                    inputRef.current = ref;
                }
            },
            id: rest.id || this.generatedId
        });
        var renderedTag = textarea
            ? React.createElement(TextFieldTextarea, __assign({}, tagProps))
            : React.createElement(TextFieldInput, __assign({}, tagProps));
        var renderedLabel = label
            ? React.createElement(
                  FloatingLabel,
                  __assign({}, this.label.props({}), {
                      ref: this.label.setRef,
                      htmlFor: tagProps.id
                  }),
                  label
              )
            : null;
        var renderedCharacterCounter = characterCount
            ? React.createElement(
                  TextFieldCharacterCount,
                  {
                      ref: function (el) {
                          _this.characterCounter = el;
                      }
                  },
                  "F"
              )
            : null;
        return React.createElement(
            React.Fragment,
            null,
            React.createElement(
                TextFieldRoot,
                __assign(
                    {},
                    this.root.props(
                        __assign({}, rootProps, { className: className, style: style })
                    ),
                    {
                        label: label,
                        invalid: invalid,
                        icon: !!icon,
                        trailingIcon: !!trailingIcon,
                        textarea: textarea,
                        dense: dense,
                        disabled: disabled,
                        outlined: outlined,
                        fullwidth: fullwidth,
                        ref: this.root.setRef
                    }
                ),
                !!icon && this.renderIcon(icon, "leadingIcon"),
                children,
                !!textarea && renderedCharacterCounter,
                renderedTag,
                !!outlined
                    ? React.createElement(
                          React.Fragment,
                          null,
                          React.createElement(
                              NotchedOutline,
                              {
                                  ref: function (ref) {
                                      return (_this.outline = ref && ref.foundation);
                                  }
                              },
                              renderedLabel
                          ),
                          !!trailingIcon && this.renderIcon(trailingIcon, "trailingIcon")
                      )
                    : React.createElement(
                          React.Fragment,
                          null,
                          renderedLabel,
                          !!trailingIcon && this.renderIcon(trailingIcon, "trailingIcon"),
                          React.createElement(LineRipple, __assign({}, this.lineRipple.props({})))
                      )
            ),
            this.renderHelpText(renderedCharacterCounter)
        );
    };
    TextField.displayName = "TextField";
    return TextField;
})(FoundationComponent);
export { TextField };
var TextFieldCharacterCount = /** @class */ (function (_super) {
    __extends(TextFieldCharacterCount, _super);
    function TextFieldCharacterCount() {
        var _this = (_super !== null && _super.apply(this, arguments)) || this;
        _this.state = {
            content: ""
        };
        return _this;
    }
    TextFieldCharacterCount.prototype.getDefaultFoundation = function () {
        var _this = this;
        return new MDCTextFieldCharacterCounterFoundation({
            setContent: function (content) {
                _this.setState({ content: content });
            }
        });
    };
    TextFieldCharacterCount.prototype.render = function () {
        return React.createElement(
            "div",
            { className: "mdc-text-field-character-counter" },
            this.state.content
        );
    };
    TextFieldCharacterCount.displayName = "TextFieldCharacterCount";
    return TextFieldCharacterCount;
})(FoundationComponent);
/** A help text component */
export var TextFieldHelperText = componentFactory({
    displayName: "TextFieldHelperText",
    classNames: function (props) {
        return [
            "mdc-text-field-helper-text",
            {
                "mdc-text-field-helper-text--persistent": props.persistent,
                "mdc-text-field-helper-text--validation-msg": props.validationMsg
            }
        ];
    },
    consumeProps: ["persistent", "validationMsg"]
});
/*********************************************************************
 * Icon
 *********************************************************************/
/**
 * An Icon in a TextField
 */
var TextFieldIcon = /** @class */ (function (_super) {
    __extends(TextFieldIcon, _super);
    function TextFieldIcon() {
        var _this = (_super !== null && _super.apply(this, arguments)) || this;
        _this.root = _this.createElement("root");
        return _this;
    }
    TextFieldIcon.prototype.getDefaultFoundation = function () {
        var _this = this;
        return new MDCTextFieldIconFoundation({
            getAttr: function (attr) {
                return _this.root.getProp(attr);
            },
            setAttr: function (attr, value) {
                return _this.root.setProp(attr, value);
            },
            removeAttr: function (attr) {
                return _this.root.removeProp(attr);
            },
            setContent: function (content) {
                // @ts-ignore
                _this.root.setProp("icon", content);
            },
            registerInteractionHandler: function (evtType, handler) {
                return _this.root.addEventListener(evtType, handler);
            },
            deregisterInteractionHandler: function (evtType, handler) {
                return _this.root.removeEventListener(evtType, handler);
            },
            notifyIconAction: function () {
                return _this.emit("onClick", {}, true);
            }
        });
    };
    TextFieldIcon.prototype.render = function () {
        return React.createElement(
            Icon,
            __assign(
                {},
                this.root.props(__assign({}, this.props, { className: "mdc-text-field__icon" }))
            )
        );
    };
    TextFieldIcon.displayName = "TextFieldIcon";
    return TextFieldIcon;
})(FoundationComponent);
export { TextFieldIcon };
