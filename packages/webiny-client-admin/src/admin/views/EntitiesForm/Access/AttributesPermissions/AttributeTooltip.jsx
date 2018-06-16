import React from "react";
import styles from "./AttributeTooltip.module.scss";
import { inject, i18n } from "webiny-client";
import _ from "lodash";
const t = i18n.namespace("Security.EntitiesForm.Access.Permissions.TogglePermissionButton");

@inject({ modules: ["Input", "Scrollbar"] })
class AttributeTooltip extends React.Component {
    constructor() {
        super();
        this.ref = null;
        this.state = {
            filter: null
        };
    }

    render() {
        const { Input, Scrollbar } = this.props.modules;

        const {list: entities} = this.props.form.state.entities;
        return (
            <div className={styles.detailsTooltip}>
                <div>
                    <h3>{t`Linked entities`}</h3>
                    <h4>{t`Choose entities that can be returned from this attribute.`}</h4>

                    <Input
                        placeholder={t`Type to filter...`}
                        ref={ref => this.ref = ref}
                        value={this.state.filter}
                        onChange={filter => {
                            this.setState({ filter });
                        }}
                    />
                    <Scrollbar style={{ height: 180 }} autoHide>
                        <ul>
                            {entities.map(entity => {
                                if (!_.isEmpty(this.state.filter)) {
                                    if (
                                        entity.name
                                            .toLowerCase()
                                            .indexOf(this.state.filter.toLowerCase()) < 0
                                    ) {
                                        return null;
                                    }
                                }
                                return <li key={entity.name}>{entity.name}</li>;
                            })}
                        </ul>
                    </Scrollbar>
                </div>
            </div>
        );
    }
}

AttributeTooltip.defaultProps = {
    form: null
};

export default AttributeTooltip;
