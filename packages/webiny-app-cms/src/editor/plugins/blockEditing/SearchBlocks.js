//@flow
import * as React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Icon } from "webiny-ui/Icon";
import { deactivatePlugin, updateElement } from "webiny-app-cms/editor/actions";
import { getContent } from "webiny-app-cms/editor/selectors";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import { getPlugins } from "webiny-app/plugins";
import { createElement } from "webiny-app-cms/editor/utils";
import { SecondaryLayout } from "webiny-app-admin/components/Views/SecondaryLayout";
import { Elevation } from "webiny-ui/Elevation";
import { ReactComponent as SearchIcon } from "webiny-app-cms/editor/assets/icons/search.svg";
import * as Styled from "./StyledComponents";
import BlockPreview from "./BlockPreview";

type SearchBarProps = {
    addKeyHandler: Function,
    createBlockFromType: Function,
    deactivatePlugin: Function,
    removeKeyHandler: Function,
    updateElement: Function,
    content: Object
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

        return (
            <BlockPreview
                key={plugin.name}
                plugin={plugin}
                addBlockToContent={this.addBlockToContent}
                deactivatePlugin={this.props.deactivatePlugin}
            />
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
                        <Tab label={"Saved"}>
                            <Styled.BlockList>
                                {plugins
                                    .filter(pl => pl.tags && pl.tags.includes("saved"))
                                    .map(this.renderPreview)}
                            </Styled.BlockList>
                        </Tab>
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
