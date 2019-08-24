// @flow
import getDataFields from "./getDataFields";

export default () => /* GraphQL */ `
    notFoundPage: getNotFoundPage {
                data ${getDataFields()}
                error {
                    code
                    message
                }
            }
`;
