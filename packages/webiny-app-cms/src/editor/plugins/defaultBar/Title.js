//@flow
import React from "react";
import styled from "react-emotion";
import {css} from "emotion";
import { connect } from "react-redux";
import { Input } from "webiny-ui/Input";
import { updatePage } from "./actions";
import { getPage } from "./selectors";
import { Tooltip } from "webiny-ui/Tooltip";
import { Typography } from "webiny-ui/Typography";
import { ReactComponent as CloseIcon } from "webiny-app-cms/editor/assets/icons/close.svg";
import { IconButton } from "webiny-ui/Button";

const TitleInputWrapper = styled("div")({
    width: "100%",
    display: "flex",
    alignItems: 'center',
    position: 'relative',
    "> .mdc-text-field--upgraded": {
        height: 35,
        marginTop: "0 !important",
        paddingLeft: 10,
        paddingRight: 40
    }
});

const resetBtn = css({
    position: 'absolute !important',
    right: -5,
    top: -5
});

const TitleWrapper = styled("div")({
    height: 50,
    display: "flex",
    alignItems: "baseline",
    justifyContent: "flex-start",
    flexDirection: "column",
    color: "var(--mdc-theme-text-primary-on-background)",
    position: "relative",
    width: "100%",
    marginLeft: 10
});

const PageTitle = styled("div")({
    border: "1px solid transparent",
    fontSize: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
    "&:hover": {
        border: "1px solid var(--mdc-theme-on-background)"
    }
});

const pageTitleWrapper = css({
    maxWidth: 'calc(100% - 50px)'
});

const PageVersion = styled("span")({
    fontSize: 20,
    color: "var(--mdc-theme-text-secondary-on-background)",
    marginLeft: 5
});

const PageMeta = styled("div")({
    height: 20,
    margin: "-2px 2px 2px 2px"
});

type Props = {
    page: Object,
    updatePage: Function
};

type State = {
    editTitle: boolean
};

class Title extends React.Component<Props, State> {
    state = {
        editTitle: false
    };

    render() {
        const { page, updatePage } = this.props;

        return this.state.editTitle ? (
            <TitleInputWrapper>
                <Input
                    autoFocus
                    fullwidth
                    value={page.title}
                    onChange={title => updatePage({ title })}
                    onBlur={() => this.setState({ editTitle: false })}
                />
                <IconButton
                    className={resetBtn}
                    onClick={() => this.setState({ editTitle: false })}
                    icon={<CloseIcon />}
                />
            </TitleInputWrapper>
        ) : (
            <TitleWrapper>
                <PageMeta>
                    <Typography use={"overline"}>Blog posts (Status: Draft)</Typography>
                </PageMeta>
                <div style={{width: '100%', display: 'flex'}}>
                    <Tooltip className={pageTitleWrapper} placement={"bottom"} content={<span>Rename</span>}>
                        <PageTitle onClick={() => this.setState({ editTitle: true })}>
                            {page.title || "Untitled"}
                        </PageTitle>
                    </Tooltip>
                    <PageVersion>(V21)</PageVersion>
                </div>
            </TitleWrapper>
        );
    }
}

export default connect(
    state => ({ page: getPage(state) }),
    { updatePage }
)(Title);
