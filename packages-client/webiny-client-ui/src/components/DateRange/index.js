import React from "react";
import _ from "lodash";
import $ from "jquery";
import { Webiny } from "webiny-client";
import "bootstrap-daterangepicker";
import "./styles.scss?extract";

/**
 * TODO: complete I18N support needed.
 */
class DateRange extends Webiny.Ui.FormComponent {
    constructor(props) {
        super(props);

        this.input = null;

        _.assign(this.state, {
            date: {
                start: null,
                end: null
            },
            rangeType: _.get(this.props, "rangeType", "")
        });

        const { moment } = props;

        this.options = {
            autoApply: true,
            alwaysShowCalendars: true,
            opens: "left",
            locale: {
                format: "DD/MMM/YY"
            },
            ranges: {
                Today: [moment(), moment()],
                Yesterday: [moment().subtract(1, "days"), moment().subtract(1, "days")],
                "Last 7 Days": [moment().subtract(6, "days"), moment()],
                "Last 30 Days": [moment().subtract(29, "days"), moment()],
                "This Month": [moment().startOf("month"), moment().endOf("month")],
                "Last Month": [
                    moment()
                        .subtract(1, "month")
                        .startOf("month"),
                    moment()
                        .subtract(1, "month")
                        .endOf("month")
                ]
            }
        };

        this.availableOptions = [
            "startDate",
            "endDate",
            "minDate",
            "maxDate",
            "dateLimit",
            "showDropdowns",
            "showWeekNumbers",
            "timePicker",
            "timePickerIncrement",
            "timePicker24hour",
            "timePickerSeconds",
            "ranges",
            "opens",
            "drops",
            "buttonClasses",
            "applyClasses",
            "cancelClasses",
            "locale",
            "singleDatePicker",
            "autoApply",
            "linkedCalendars",
            "parentEl",
            "isInvalidDate",
            "autoUpdateInput",
            "alwaysShowCalendars"
        ];

        this.bindMethods("setup,onChange,setInitialRange");
    }

    componentDidUpdate(prevProps, prevState) {
        super.componentDidUpdate();
        if (prevState.isValid !== this.state.isValid) {
            this.input.setState({
                isValid: this.state.isValid,
                validationMessage: this.state.validationMessage
            });
        }
    }

    componentWillUnmount(props) {
        super.componentWillUnmount(props);
        this.unregisterListeners();
    }

    componentWillReceiveProps(props) {
        if (!this.getInput()) {
            return;
        }

        if (!props.value) {
            this.getInput().value = this.getPlaceholder() || "";
        } else {
            const dates = props.value.split(this.props.rangeDelimiter);
            this.element.data("daterangepicker").setStartDate(dates[0]);
            this.element.data("daterangepicker").setEndDate(dates[1]);
        }
    }

    setInitialRange(start, end) {
        const { moment } = this.props;
        const from = moment(start, this.options.locale.format, true);
        const to = moment(end, this.options.locale.format, true);
        if (from.isValid() && to.isValid()) {
            this.options.startDate = start;
            this.options.endDate = end;
        }
    }

    getInput() {
        return this.input;
    }

    setup() {
        this.element = $(this.getInput());

        // detect to which side we need to open the range selector in case opens is set to auto
        let opens = "left";
        if (this.props.opens === "auto") {
            let left = this.element.offset().left;
            let windowWidth = window.innerWidth;

            let offset = left / windowWidth * 100;

            // if within first 30% of the screen, open to left
            if (offset <= 30) {
                opens = "right";
            } else if (offset > 30 && offset <= 60) {
                opens = "center";
            } else {
                opens = "left";
            }
        }

        const range = _.get(this.options.ranges, _.get(this.props, "rangeType"));
        _.assign(this.options, this.props.options || {}, _.pick(this.props, this.availableOptions));
        this.options.locale.format = this.props.inputFormat;
        this.options.opens = opens;

        const value = this.getValue();
        if (value) {
            const parts = value.split(this.props.rangeDelimiter);
            this.setInitialRange(parts[0], parts[1]);
        } else if (range) {
            this.setInitialRange(range[0], range[1]);
        }

        this.element.daterangepicker(this.options);
        this.element.on("apply.daterangepicker", (ev, picker) => {
            this.onChange(picker);
        });

        if (!value) {
            this.element[0].value = this.getPlaceholder() || "";
        }

        return this;
    }

    onChange(picker = {}) {
        try {
            if (!this.getInput()) {
                return this;
            }

            const { moment } = this.props;
            const dates = this.getInput().value.split(" - ");
            const from = moment(dates[0], this.props.inputFormat, true);
            const to = moment(dates[1], this.props.inputFormat, true);

            if (from.isValid() && to.isValid()) {
                const fromYmd = from.format(this.props.modelFormat);
                const toYmd = to.format(this.props.modelFormat);
                const state = {
                    date: {
                        range: fromYmd + this.props.rangeDelimiter + toYmd,
                        from: fromYmd,
                        to: toYmd
                    },
                    rangeType: _.get(picker, "chosenLabel", this.state.rangeType)
                };
                this.setState(state, () => {
                    this.props.onChange(this.state.date.range, this.validate);
                });
            }
        } catch (e) {
            console.log(e);
        }
    }

    unregisterListeners() {
        this.element.off("apply.daterangepicker");
        return this;
    }

    renderPreview() {
        if (!this.state.date.range) {
            return null;
        }

        const { moment } = this.props;
        const dates = this.state.date.range.split(this.props.rangeDelimiter);
        const from = moment(dates[0], this.props.modelFormat, true);
        const to = moment(dates[1], this.props.modelFormat, true);

        return from.format(this.props.inputFormat + " - " + to.format(this.props.inputFormat));
    }
}

DateRange.defaultProps = Webiny.Ui.FormComponent.extendProps({
    inputFormat: "YYYY-MM-DD",
    modelFormat: "YYYY-MM-DD",
    rangeDelimiter: ":",
    rangeType: "Last 30 Days", // initial date range
    opens: "auto",
    renderer() {
        const omitProps = [
            "attachToForm",
            "attachValidators",
            "detachFromForm",
            "validateInput",
            "form",
            "renderer",
            "name",
            "onChange"
        ];
        const props = _.omit(this.props, omitProps);
        const { Input, Icon } = props;
        props.addonRight = <Icon icon="icon-calendar" />;
        props.value = this.renderPreview();
        props.onComponentDidMount = input => {
            this.input = input;
            this.setup();
        };

        return <Input onRef={ref => (this.input = ref)} {...props} />;
    }
});

export default Webiny.createComponent(DateRange, {
    modules: ["Icon", "Input", { moment: "Webiny/Vendors/Moment" }]
});
