// @flow
import * as React from "react";
import { TopProgressBar } from "webiny-ui/TopProgressBar";

const withTopProgressBar = () => {
    return (BaseComponent: React.ComponentType<any>) => {
        const WithTopProgressBar = (props: Object) => {
            return (
                <TopProgressBar>
                    {({ start, finish, nprogress }) => (
                        <BaseComponent
                            {...props}
                            startTopProgressBar={start}
                            finishTopProgressBar={finish}
                            nprogress={nprogress}
                        />
                    )}
                </TopProgressBar>
            );
        };

        return WithTopProgressBar;
    };
};

export default withTopProgressBar;
