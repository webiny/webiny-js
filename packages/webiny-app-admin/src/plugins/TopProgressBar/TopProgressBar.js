// @flow
import { connect } from "react-redux";
import { compose, lifecycle } from "recompose";
import { withTopProgressBar } from "webiny-ui/TopProgressBar/hoc";

const TopProgressBar = () => null;

export default compose(
    connect(state => ({
        activeOperationsCount: state.graphql ? state.graphql.activeOperationsCount : 0
    })),
    withTopProgressBar(),
    lifecycle({
        componentDidMount() {
            this.props.nprogress.configure({ showSpinner: false, trickleSpeed: 10 });
        },
        componentDidUpdate(prevProps) {
            const graphQlOperations = {
                prev: prevProps.activeOperationsCount,
                current: this.props.activeOperationsCount
            };

            if (graphQlOperations.prev === 0 && graphQlOperations.current > 0) {
                prevProps.startTopProgressBar();
            }

            if (graphQlOperations.prev > 0 && graphQlOperations.current === 0) {
                prevProps.finishTopProgressBar();
            }
        }
    })
)(TopProgressBar);
