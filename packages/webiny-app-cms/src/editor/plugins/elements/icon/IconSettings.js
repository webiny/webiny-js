//@flow
import * as React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { isEqual } from "lodash";
import { getPlugins } from "webiny-app/plugins";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import IconPicker from "webiny-app-cms/editor/components/IconPicker";
import { get, set } from "dot-prop-immutable";
import { withActiveElement } from "webiny-app-cms/editor/components";
import { updateElement } from "webiny-app-cms/editor/actions";
import { InputContainer } from "../../elementSettings/utils/StyledComponents";

type Props = {
    element: Object,
    updateElement: Function
};

let icons;
const getIcons = () => {
    if (!icons) {
        icons = getPlugins("cms-icons").reduce((icons: Array<Object>, pl: Object) => {
            return icons.concat(pl.getIcons());
        }, []);
    }
    return icons;
};

const getSvg = (id: Array<string>, width = 24) => {
    const svg = getIcons().find(ic => isEqual(ic.id, id)).svg;
    return svg.replace(`width="24"`, `width="${width}"`);
};

class IconSettings extends React.Component<Props> {
    historyUpdated = {};

    updateSettings = (name, value, history = true) => {
        const { element, updateElement } = this.props;
        const attrKey = `settings.advanced.icon.${name}`;

        let newElement = set(element, attrKey, value);

        const { id, size } = get(newElement, "settings.advanced.icon");
        newElement = set(newElement, "data.icon", getSvg(id, size));

        if (!history) {
            updateElement({ element: newElement, history });
            return;
        }

        if (this.historyUpdated[name] !== value) {
            this.historyUpdated[name] = value;
            updateElement({ element: newElement });
        }
    };

    render() {
        const { element } = this.props;
        const { settings: { advanced: { icon } = {} } = {} } = element;

        return (
            <React.Fragment>
                <Tabs>
                    <Tab label={"Icon"}>
                        <Grid>
                            <Cell span={4}>
                                <Typography use={"overline"}>Icon</Typography>
                            </Cell>
                            <Cell span={8}>
                                <IconPicker
                                    label={"Icon"}
                                    value={icon.id}
                                    onChange={({ id }) => this.updateSettings("id", id)}
                                />
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={4}>
                                <Typography use={"overline"}>Icon size</Typography>
                            </Cell>
                            <Cell span={8}>
                                <InputContainer>
                                    <Input
                                        value={icon.size}
                                        onChange={size => this.updateSettings("size", size)}
                                    />
                                </InputContainer>
                            </Cell>
                        </Grid>
                    </Tab>
                </Tabs>
            </React.Fragment>
        );
    }
}

export default compose(
    connect(
        null,
        { updateElement }
    ),
    withActiveElement()
)(IconSettings);
