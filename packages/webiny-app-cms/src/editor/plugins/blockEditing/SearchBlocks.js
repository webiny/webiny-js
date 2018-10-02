//@flow
import * as React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { ButtonFloating } from "webiny-ui/Button";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Icon } from "webiny-ui/Icon";
import { deactivatePlugin, updateElement } from "webiny-app-cms/editor/actions";
import { getContent } from "webiny-app-cms/editor/selectors";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import { getPlugins } from "webiny-app/plugins";
import { updateChildPaths, createElement } from "webiny-app-cms/editor/utils";
import Element from "webiny-app-cms/render/components/Element";
import { SecondaryLayout } from "webiny-app-admin/components/Views/SecondaryLayout";
import { Elevation } from "webiny-ui/Elevation";

import { ReactComponent as AddIcon } from "webiny-app-cms/editor/assets/icons/add.svg";
import { ReactComponent as SearchIcon } from "webiny-app-cms/editor/assets/icons/search.svg";
import * as Styled from "./StyledComponents";
import AutoScale from "./AutoScale";

type SearchBarProps = {
    addKeyHandler: Function,
    createBlockFromType: Function,
    deactivatePlugin: Function,
    removeKeyHandler: Function
};

type SearchBarState = {
    search: string,
    activeTab: number
};

class SearchBar extends React.Component<SearchBarProps, SearchBarState> {
    state = {
        search: "",
        activeTab: 0
    };

    componentDidMount() {
        this.props.addKeyHandler("escape", e => {
            e.preventDefault();
            this.props.deactivatePlugin({ name: "cms-search-blocks-bar" });
        });
    }

    componentWillUnmount() {
        this.props.removeKeyHandler("escape");
    }

    shouldComponentUpdate(props, state) {
        return state.search !== this.state.search || state.activeTab !== this.state.activeTab;
    }

    addBlockToContent = plugin => {
        const { content } = this.props;
        const element = { ...content, elements: [...content.elements, createElement(plugin.name)] };
        this.props.updateElement({ element });
    };

    renderPreview = plugin => {
        // Filter based on search query and block keywords
        let match = false;
        if (this.state.search === "") {
            match = true;
        } else {
            plugin.keywords.forEach(kwd => {
                if (kwd === "*" || kwd.toLowerCase().startsWith(this.state.search.toLowerCase())) {
                    match = true;
                }
            });
        }

        if (!match) {
            return null;
        }

        const block = plugin.create();
        block.path = "-1";
        updateChildPaths(block);

        return (
            <Elevation z={1} key={plugin.name}>
                <Styled.Block>
                    <Styled.Overlay>
                        <Styled.Backdrop className={"backdrop"} />
                        <Styled.AddBlock className={"add-block"}>
                            <ButtonFloating
                                label={"Click to Add"}
                                onClick={e => {
                                    this.addBlockToContent(plugin);
                                    !e.shiftKey &&
                                        this.props.deactivatePlugin({
                                            name: "cms-search-blocks-bar"
                                        });
                                }}
                                icon={<AddIcon />}
                            />
                        </Styled.AddBlock>
                    </Styled.Overlay>
                    <Styled.BlockPreview>
                        <AutoScale maxWidth={310}>
                            <Element element={block} />
                        </AutoScale>
                    </Styled.BlockPreview>
                </Styled.Block>
            </Elevation>
        );
    };

    renderSearchInput = () => {
        return (
            <Styled.Input>
                <Icon className={Styled.searchIcon} icon={<SearchIcon />} />
                <input
                    autoFocus
                    type={"text"}
                    placeholder="Search blocks..."
                    value={this.state.search}
                    onChange={e => this.setState({ search: e.target.value })}
                />
            </Styled.Input>
        );
    };

    render() {
        const plugins = getPlugins("cms-block");

        return (
            <SecondaryLayout
                barMiddle={this.renderSearchInput()}
                onExited={() => this.props.deactivatePlugin({ name: "cms-search-blocks-bar" })}
            >
                <Elevation className={Styled.wrapper} z={1}>
                    <Tabs>
                        <Tab label={"All"}>
                            <Styled.BlockList>{plugins.map(this.renderPreview)}</Styled.BlockList>
                        </Tab>
                        <Tab label={"Saved"} />
                        <Tab label={"Global"} />
                    </Tabs>
                </Elevation>
            </SecondaryLayout>
        );
    }
}

export default compose(
    connect(
        state => ({ content: getContent(state) }),
        {
            deactivatePlugin,
            updateElement
        }
    ),
    withKeyHandler()
)(SearchBar);
