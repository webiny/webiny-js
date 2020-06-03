import gql from "graphql-tag";

export const GET_CONTENT_MODEL = gql`
  query HeadlessCmsGetContentModel($where: JSON) {
      getContentModel(where: $where) {
          data {
              id
              modelId
              titleFieldId
          }
      }
  }
`;

export const extractIdStringFromValue = (value) => {
  if (!value) {
    return "";
  }

  if (Array.isArray(value) && value.filter(Boolean).length) {
    const [first] = value;
    if (typeof first === "string") {
      return first;
    }

    if (first.id) {
      return first.id;
    }
  }

  return "";
}

export const extractIdsFromValue = (values, list) => {
  if (!values) {
    return [];
  }
  const IDs = values.map(value => {
    if (typeof value === "string") {
      return value;
    }

    if (value.id) {
      return value.id;
    }

    return "";
  }).filter(Boolean);

  return list.filter(item => IDs.some(id => id === item.id));
}