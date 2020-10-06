import gql from "graphql-tag";

const fields = `
    id
    title
    slug
    description
    items
`;

export const READ_MENU = gql`
    query getMenu($id: ID!) {
        pageBuilder {
            menu: getMenu(id: $id){
                data {
                    ${fields}
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;