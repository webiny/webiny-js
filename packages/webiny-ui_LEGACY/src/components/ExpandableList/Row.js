import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import $ from "jquery";
import { inject, isElementOfType } from "webiny-app";
import Field from "./Field";
import ActionSet from "./ActionSet";
import RowDetailsList from "./RowDetailsList";
import RowDetailsContent from "./RowDetailsContent";

@inject({ modules: ["Grid"] })
class Row extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: false,
            mounted: false,
            actionSetActive: false,
            rowClass: "expandable-list__row"
        };

        [
            "hideRowDetails",
            "showRowDetails",
            "handleClickOutside",
            "renderField",
            "attachCloseListener",
            "deatachCloseListener",
            "showActionSet",
            "hideActionSet",
            "getCurrentRowClass"
        ].map(m => (this[m] = this[m].bind(this)));
    }

    componentWillUnmount() {
        this.setState({ mounted: false });
        this.deatachCloseListener();
    }

    componentWillMount() {
        this.setState({ mounted: true });
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextState.active === true || nextState.actionSetActive === true) {
            this.attachCloseListener();
        } else {
            this.deatachCloseListener();
        }

        return true;
    }

    attachCloseListener() {
        document.addEventListener("click", this.handleClickOutside, true);
    }

    deatachCloseListener() {
        document.removeEventListener("click", this.handleClickOutside, true);
    }

    handleClickOutside(e) {
        if (
            (this.state.active === false && this.state.actionSetActive === false) ||
            !this.state.mounted
        ) {
            return true;
        }

        if ($(this.dom).has(e.target).length === 0 && !$(this.dom).is(e.target)) {
            // clicked outside
            if (this.state.active) {
                this.hideRowDetails();
            } else {
                this.hideActionSet();
            }
        } else {
            // clicked inside
            return false;
        }
    }

    hideRowDetails() {
        if (this.state.active === false || !this.state.mounted) {
            return true;
        }

        // hide row details
        const details = this.dom.find(".expandable-list__row__details:first");
        this.dom.removeClass("expandable-list__row--active");
        details.hide();

        // show row content
        this.dom.find("div.expandable-list__row-wrapper:first").show();

        this.setState({ active: false });
    }

    getCurrentRowClass() {
        if (this.state.active) {
            return "expandable-list__row--active expandable-list__row";
        }

        return "expandable-list__row";
    }

    showRowDetails() {
        if (this.state.active === true) {
            return true;
        }

        // show row details
        const details = $(this.dom).find(".expandable-list__row__details:first");
        $(this.dom).addClass("expandable-list__row--active");
        details.show();

        // hide row content and action set
        $(this.dom)
            .find("div.expandable-list__row-wrapper:first")
            .hide();

        this.setState({ active: true });
    }

    showActionSet() {
        this.setState({
            actionSetActive: true,
            rowClass: this.getCurrentRowClass() + " expandable-list__row--active-action-set"
        });
    }

    hideActionSet() {
        this.setState({
            actionSetActive: false,
            rowClass: this.getCurrentRowClass()
        });
    }

    renderField(field, i) {
        const props = _.omit(field.props, ["children"]);
        _.assign(props, {
            data: this.data,
            key: i,
            onClick: () => {
                this.showRowDetails();
            }
        });

        return React.cloneElement(field, props);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        let fields = [];
        let actionSet = false;
        let details = "";
        this.props.children.map(child => {
            if (isElementOfType(child, Field)) {
                fields.push(child);
            } else if (
                isElementOfType(child, RowDetailsContent) ||
                isElementOfType(child, RowDetailsList)
            ) {
                details = child;
            } else if (isElementOfType(child, ActionSet)) {
                actionSet = child;
            }
        });

        // render action set
        if (actionSet) {
            const className =
                "expandable-list__row__action-set expandable-list__row__fields__field flex-cell flex-width-2";
            actionSet = (
                <div className={className} onClick={this.showActionSet}>
                    {actionSet}
                </div>
            );
        }

        // render fields
        fields = fields.map(this.renderField);

        const { modules: { Grid } } = this.props;

        return (
            <div className={this.state.rowClass} ref={ref => (this.dom = ref)}>
                <div className="expandable-list__row-wrapper flex-row">
                    {fields}
                    {actionSet}
                </div>
                <Grid.Row className="expandable-list__row__details" style={{ display: "none" }}>
                    <div className="flex-row">
                        <div className="expandable-list__title flex-cell flex-width-10">
                            <h4>{details.props.title}</h4>
                        </div>
                        {actionSet}
                    </div>
                    {this.state.active && details}
                </Grid.Row>
            </div>
        );
    }
}

Row.defaultProps = {
    onClick: _.noop
};

export default Row;
