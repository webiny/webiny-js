import { GraphQLEntityWithSameModelEntityTypes, GraphQLEntity } from "./entities/GraphQLEntity";
import bootstrap from "./utils/bootstrap";
import convertAttributeToGraphQLType from "./../src/attributes/convertAttributeToGraphQLType";
import { api } from "./../lib";
import { GraphQLList, GraphQLUnionType } from "graphql";

const getField = (name, entity = "GraphQLEntity") => {
    return api.graphql
        .getSchema()
        .getType(entity)
        .getFields()[name];
};

describe("Entity attributes to GraphQL types conversion", function() {
    beforeAll(() => {
        bootstrap();
        api.graphql.schema(schema => {
            schema.addAttributeConverter(convertAttributeToGraphQLType);
            schema.registerEntity(GraphQLEntity);
            schema.registerEntity(GraphQLEntityWithSameModelEntityTypes);
        });
    });

    test("char attribute", () => {
        const field = getField("char");
        expect(field.type.name).toBe("String");
    });

    test("password attribute", () => {
        const field = getField("password");
        expect(field.type.name).toBe("String");
    });

    test("boolean attribute", () => {
        const field = getField("boolean");
        expect(field.type.name).toBe("Boolean");
    });

    test("integer attribute", () => {
        const field = getField("integer");
        expect(field.type.name).toBe("Int");
    });

    test("float attribute", () => {
        const field = getField("float");
        expect(field.type.name).toBe("Float");
    });

    test("buffer attribute", () => {
        const field = getField("buffer");
        expect(field.type.name).toBe("String");
    });

    test("array attribute", () => {
        const field = getField("array");
        expect(field.type).toBeInstanceOf(GraphQLList);
        expect(field.type.ofType.name).toBe("JSON");
    });

    test("object attribute", () => {
        const field = getField("object");
        expect(field.type.name).toBe("JSON");
    });

    test("date attribute", () => {
        const field = getField("date");
        expect(field.type.name).toBe("String");
    });

    test("model attribute", () => {
        const field = getField("modelAttr");
        expect(field.type.name).toBe("ModelAttrModel");
    });

    test("models attribute", () => {
        const field = getField("modelsAttr");
        expect(field.type).toBeInstanceOf(GraphQLList);
        expect(field.type.ofType.name).toBe("ModelsAttrModel");
    });

    test("entity attribute", () => {
        const field = getField("entityAttr");
        expect(field.type.name).toBe("EntityAttrModel");
    });

    test("entities attribute", () => {
        const field = getField("entitiesAttr");
        expect(field.type).toBeInstanceOf(GraphQLList);
        expect(field.type.ofType.name).toBe("EntitiesAttrModel");
    });

    test("model attribute - make sure types are also correctly set on another entity", () => {
        const field = getField("modelAttr", "GraphQLEntityWithSameModelEntityTypes");
        expect(field.type.name).toBe("ModelAttrModel");
    });

    test("models attribute - make sure types are also correctly set on another entity", () => {
        const field = getField("modelsAttr", "GraphQLEntityWithSameModelEntityTypes");
        expect(field.type).toBeInstanceOf(GraphQLList);
        expect(field.type.ofType.name).toBe("ModelsAttrModel");
    });

    test("entity attribute - make sure types are also correctly set on another entity", () => {
        const field = getField("entityAttr", "GraphQLEntityWithSameModelEntityTypes");
        expect(field.type.name).toBe("EntityAttrModel");
    });

    test("entities attribute - make sure types are also correctly set on another entity", () => {
        const field = getField("entitiesAttr", "GraphQLEntityWithSameModelEntityTypes");
        expect(field.type).toBeInstanceOf(GraphQLList);
        expect(field.type.ofType.name).toBe("EntitiesAttrModel");
    });

    test("multiple entities attribute", () => {
        const field = getField("multipleEntitiesAttr");
        expect(field.type).toBeInstanceOf(GraphQLUnionType);

        const types = field.type.getTypes();
        expect(types).toHaveLength(3);

        expect(types[0].name).toBe("EntityAttrModel");
        expect(types[1].name).toBe("EntitiesAttrModel");
        expect(types[2].name).toBe("EntitiesAttrModeNonUsed");
    });

    test("asterisk entities attribute", () => {
        const field = getField("asteriskEntitiesAttr");
        expect(field.type).toBeInstanceOf(GraphQLUnionType);
        expect(field.type.name).toBe("EntityType");
    });
});
