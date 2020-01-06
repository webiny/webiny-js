// @flow
import getDataFields from "./getDataFields";

export default () => /* GraphQL */ `
    errorPage: getErrorPage {
                data ${getDataFields()}
                error {
                    code
                    message
                }
            }
`;
