// @flow
import { ApolloLink, Observable } from "apollo-link";
import localStorage from "store";
import { get } from "lodash";

export default ({ token = "webiny-token" }: { token: string } = {}) => {
    return new ApolloLink((operation, forward) => {
        const tokenValue = localStorage.get(token);
        if (tokenValue) {
            operation.setContext({
                headers: {
                    Authorization: tokenValue
                }
            });
        }

        const observable = forward(operation);

        const unsetTokenCodes = ["TOKEN_EXPIRED", "TOKEN_INVALID"];

        return new Observable(observer => {
            const subscription = observable.subscribe({
                next: data => {
                    if (data.errors) {
                        data.errors.forEach(error => {
                            let code = get(error, "extensions.exception.code", error.code);
                            if (unsetTokenCodes.includes(code)) {
                                localStorage.remove(token);
                            }
                        });
                    }
                    return observer.next.bind(observer)(data);
                },
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer)
            });

            return () => {
                subscription.unsubscribe();
            };
        });
    });
};
