import React from "react";
import { Component } from "webiny-client";

@Component({
    modules: [{ pluralize: () => import("pluralize") }]
})
class Pluralize extends React.Component {
    render() {
        let noun = this.props.noun;
        // If 'plural' is set, it will be used as plural form of given noun.
        if (this.props.plural && this.props.count !== 1) {
            noun = this.props.plural;
        }

        if (!this.props.plural && this.props.count !== 1) {
            noun = this.props.modules.pluralize(this.props.noun, this.props.count);
        }

        const result = this.props.pattern
            .replace("{count}", this.props.count)
            .replace("{noun}", noun);

        return <span>{result}</span>;
    }
}

Pluralize.defaultProps = {
    plural: null,
    count: null,
    noun: null,
    pattern: "{count} {noun}"
};

export default Pluralize;
