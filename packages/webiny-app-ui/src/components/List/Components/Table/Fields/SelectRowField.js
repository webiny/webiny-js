import React from "react";
import { createComponent, LazyLoad } from "webiny-app";
import styles from "../../../styles.css";

class SelectRowField extends React.Component {
    render() {
        const { rowSelected, rowDisabled, onSelect, modules: { Checkbox, List }, render, ...props } = this.props;

        if (render) {
            return render.call(this);
        }

        return (
            <List.Table.Field {...props} rowSelected={rowSelected} className="row-details">
                {() => (
                    <Checkbox
                        disabled={rowDisabled}
                        value={rowSelected}
                        onChange={onSelect}
                        className={styles.selectRow}
                    />
                )}
            </List.Table.Field>
        );
    }
}

SelectRowField.defaultProps = {
    renderHeader() {
        return (
            <th>
                <LazyLoad modules={["Checkbox"]}>
                    {({ Checkbox }) => (
                        <Checkbox
                            value={this.props.allRowsSelected}
                            onChange={this.props.onSelectAll}
                            className={styles.selectRow}
                        />
                    )}
                </LazyLoad>
            </th>
        );
    }
};

export default createComponent(SelectRowField, {
    modules: ["Checkbox", "List"],
    styles,
    tableField: true
});
