import React from "react";
import { Component } from "webiny-app";

@Component({ modules: ["Input", "Grid", "Section"] })
export default class WidgetStyle extends React.Component {
    render() {
        const {
            Bind,
            modules: { Input, Grid, Section }
        } = this.props;
        return (
            <React.Fragment>
                <Section title={"Content"}/>
                <Grid.Row>
                    <Grid.Col all={12}>
                        <Bind>
                            <Input name={"style.content.className"} label={"CSS class"}/>
                        </Bind>
                    </Grid.Col>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Col all={6}>
                        <Bind>
                            <Input name={"style.content.width"} label={"Width"} />
                        </Bind>
                    </Grid.Col>
                    <Grid.Col all={6}>
                        <Bind>
                            <Input name={"style.content.padding"} label={"Padding"} />
                        </Bind>
                    </Grid.Col>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Col all={12}>
                        <Bind>
                            <Input name={"style.content.backgroundColor"} label={"Background"} type={"color"}/>
                        </Bind>
                    </Grid.Col>
                </Grid.Row>
                <Section title={"Widget"}/>
                <Grid.Row>
                    <Grid.Col all={12}>
                        <Bind>
                            <Input name={"style.widget.className"} label={"CSS class"}/>
                        </Bind>
                    </Grid.Col>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Col all={6}>
                        <Bind>
                            <Input name={"style.widget.margin"} label={"Margin"} />
                        </Bind>
                    </Grid.Col>
                    <Grid.Col all={6}>
                        <Bind>
                            <Input name={"style.widget.padding"} label={"Padding"} />
                        </Bind>
                    </Grid.Col>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Col all={12}>
                        <Bind>
                            <Input name={"style.widget.backgroundColor"} label={"Background"} type={"color"}/>
                        </Bind>
                    </Grid.Col>
                </Grid.Row>
            </React.Fragment>
        );
    }
}
