// @flow
import React from "react";
import store from "store";
import observe from "store/plugins/observe";
store.addPlugin(observe);

const LOCAL_STORAGE_KEY = "webiny_dark_mode";

const { Provider, Consumer } = React.createContext();

export const ThemeConsumer = ({ children }: Object) => (
    <Consumer>{theme => React.cloneElement(children, { theme })}</Consumer>
);

export class ThemeProvider extends React.Component<*, *> {
    state = {
        dark: false
    };

    componentDidMount() {
        store.observe(LOCAL_STORAGE_KEY, async (theme: boolean) => {
            this.setState({ dark: Boolean(theme) });
        });
    }

    componentDidUpdate(prevProps: Object, prevState: Object) {
        if (this.state.dark === prevState.dark) {
            return;
        }

        if (!this.state.dark) {
            window.document.body.classList.remove("dark-theme");
        } else {
            window.document.body.classList.add("dark-theme");
        }
    }

    enableDarkMode = () => {
        store.set(LOCAL_STORAGE_KEY, 1);
    };

    disableDarkMode = () => {
        store.remove(LOCAL_STORAGE_KEY);
    };

    toggleDarkMode = () => {
        if (store.get(LOCAL_STORAGE_KEY)) {
            store.remove(LOCAL_STORAGE_KEY);
        } else {
            store.set(LOCAL_STORAGE_KEY, 1);
        }
    };

    render() {
        const theme = {
            enableDarkMode: this.enableDarkMode,
            disableDarkMode: this.disableDarkMode,
            toggleDarkMode: this.toggleDarkMode,
            theme: { dark: this.state.dark }
        };
        return <Provider value={theme}>{this.props.children}</Provider>;
    }
}
