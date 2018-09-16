// @flow
import { withTheme } from "webiny-app-admin/components";
import { compose, lifecycle } from "recompose";

const Theme = ({ children }) => {
    return children;
};

export default compose(
    withTheme(),
    lifecycle({
        componentDidMount() {
            this.props.chooseInitialTheme();
        },
        componentDidUpdate(prevProps) {
            const { theme } = this.props;
            if (theme.dark === prevProps.dark) {
                return;
            }

            if (!theme.dark) {
                window.document.body.classList.remove("dark-theme");
            } else {
                window.document.body.classList.add("dark-theme");
            }
        }
    })
)(Theme);
