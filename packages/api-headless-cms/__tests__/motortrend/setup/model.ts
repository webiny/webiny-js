import { CmsGroupPlugin } from "~/plugins/CmsGroupPlugin";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";

export const createMotorTrendCmsModel = () => {
    return [
        // Defines a new "Buyer's Guide" content models group.
        new CmsGroupPlugin({
            id: "buyersguide",
            name: "BuyersGuide",
            slug: "buyers-guide",
            icon: "fas/car",
            description: "Cars BuyersGuide Model"
        }),

        // Defines a new "Cars" content model.
        new CmsModelPlugin({
            //
            name: "Cars",
            modelId: "cars",
            description: "Buyers Guide Cars Data Model",
            group: {
                id: "buyersguide",
                name: "BuyersGuide"
            },
            fields: [
                {
                    id: "carsVehicle",
                    fieldId: "carsVehicle",
                    type: "text",
                    label: "Vehicle",
                    helpText: "Make Model Year and Trim",
                    renderer: { name: "text-input" },
                    validation: [
                        {
                            name: "required",
                            message: "Value is required."
                        }
                    ]
                },
                {
                    id: "isGood",
                    fieldId: "isGood",
                    type: "boolean",
                    label: "Is Car Good?",
                    helpText: "Is Car Any Good?",
                    renderer: { name: "boolean-input" },
                    validation: []
                },
                {
                    id: "vehicleNmb",
                    fieldId: "vehicleNmb",
                    type: "number",
                    label: "VehicleNumber",
                    helpText: "A unique vehicle number",
                    renderer: { name: "text-input" },
                    validation: [
                        {
                            name: "required",
                            message: "Value is required."
                        }
                    ]
                },
                {
                    id: "carsYear",
                    fieldId: "carsYear",
                    type: "number",
                    label: "Year",
                    renderer: { name: "text-input" }
                },
                {
                    id: "carsMake",
                    fieldId: "carsMake",
                    type: "text",
                    label: "Make",
                    renderer: { name: "text-input" }
                },
                {
                    id: "carsModelName",
                    fieldId: "carsModelName",
                    type: "text",
                    label: "ModelName",
                    renderer: { name: "text-input" }
                },
                {
                    id: "manufacturerCd",
                    fieldId: "manufacturerCd",
                    type: "text",
                    label: "Manufacturer Code",
                    renderer: { name: "text-input" }
                },
                {
                    id: "releaseType",
                    fieldId: "releaseType",
                    type: "text",
                    label: "ReleaseType (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "newUsedBg",
                    fieldId: "newUsedBg",
                    type: "text",
                    label: "NewUsedBg (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "carsUid",
                    fieldId: "carsUid",
                    type: "number",
                    label: "UID",
                    renderer: { name: "text-input" }
                },
                {
                    id: "carsDiscontinued",
                    fieldId: "carsDiscontinued",
                    type: "number",
                    label: "Discontinued",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugMake",
                    fieldId: "slugMake",
                    type: "text",
                    label: "Slug Make",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugModelName",
                    fieldId: "slugModelName",
                    type: "text",
                    label: "SlugModelName",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugTrimName",
                    fieldId: "slugTrimName",
                    type: "text",
                    label: "SlugTrimName (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugBodystyle",
                    fieldId: "slugBodystyle",
                    type: "text",
                    label: "SlugBodystyle (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "makeFeaturedImage",
                    fieldId: "makeFeaturedImage",
                    type: "text",
                    label: "MakeFeaturedImage (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "makeIcon",
                    fieldId: "makeIcon",
                    type: "text",
                    label: "MakeIcon (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "makeDiscontinued",
                    fieldId: "makeDiscontinued",
                    type: "number",
                    label: "Make Discontinued",
                    renderer: { name: "text-input" }
                },
                {
                    id: "baseVehicle",
                    fieldId: "baseVehicle",
                    type: "number",
                    label: "BaseVehicle (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "oemUrl",
                    fieldId: "oemUrl",
                    type: "text",
                    label: "OemUrl (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "carsSubcategory",
                    fieldId: "carsSubcategory",
                    type: "text",
                    label: "Subcategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugSubcategory",
                    fieldId: "slugSubcategory",
                    type: "text",
                    label: "SlugSubcategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "mainCategory",
                    fieldId: "mainCategory",
                    type: "text",
                    label: "MainCategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugMainCategory",
                    fieldId: "slugMainCategory",
                    type: "text",
                    label: "SlugMainCategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "hybridElectricCategory",
                    fieldId: "hybridElectricCategory",
                    type: "text",
                    label: "HybridElectricCategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugHybridElectricCategory",
                    fieldId: "slugHybridElectricCategory",
                    type: "text",
                    label: "SlugHybridElectricCategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "dieselCategory",
                    fieldId: "dieselCategory",
                    type: "text",
                    label: "DieselCategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugDieselCategory",
                    fieldId: "slugDieselCategory",
                    type: "text",
                    label: "SlugDieselCategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "updatedOn",
                    fieldId: "updatedOn",
                    type: "text",
                    label: "UpdatedOn",
                    renderer: { name: "text-input" }
                },
                {
                    id: "vehicleStatus",
                    fieldId: "vehicleStatus",
                    type: "number",
                    label: "VehicleStatus (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "featuredImage",
                    fieldId: "featuredImage",
                    type: "text",
                    label: "FeaturedImage (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "propertyType",
                    fieldId: "propertyType",
                    type: "text",
                    label: "PropertyType (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "marketingImage",
                    fieldId: "marketingImage",
                    type: "text",
                    label: "MarketingImage (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "priceRangeValue",
                    fieldId: "priceRangeValue",
                    type: "number",
                    label: "PriceRangeValue (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "priceRangeText",
                    fieldId: "priceRangeText",
                    type: "text",
                    label: "PriceRangeText (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "ymmPriceRange",
                    fieldId: "ymmPriceRange",
                    type: "text",
                    label: "YMMPriceRange (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "bodyType",
                    fieldId: "bodyType",
                    type: "text",
                    label: "BodyType",
                    renderer: { name: "text-input" }
                },
                {
                    id: "bodyTypeText",
                    fieldId: "bodyTypeText",
                    type: "text",
                    label: "BodyType Text",
                    renderer: { name: "text-input" }
                },
                {
                    id: "bodyTypeOrder",
                    fieldId: "bodyTypeOrder",
                    type: "number",
                    label: "BodyTypeOrder (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "secondaryBodyType",
                    fieldId: "secondaryBodyType",
                    type: "text",
                    label: "SecondaryBodyType (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "secondaryBodyTypeText",
                    fieldId: "secondaryBodyTypeText",
                    type: "text",
                    label: "SecondaryBodyTypeText (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "secondaryBodyTypeOrder",
                    fieldId: "secondaryBodyTypeOrder",
                    type: "number",
                    label: "SecondaryBodyTypeOrder (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "priceRangeSlug",
                    fieldId: "priceRangeSlug",
                    type: "text",
                    label: "PriceRangeSlug (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "latestYear",
                    fieldId: "latestYear",
                    type: "number",
                    label: "LatestYear (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "ymmLowestPriceRange",
                    fieldId: "ymmLowestPriceRange",
                    type: "number",
                    label: "YMMLowestPriceRange (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "ymmMaxPriceRange",
                    fieldId: "ymmMaxPriceRange",
                    type: "number",
                    label: "YMMMaxPriceRange (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "makeThumbnailUrl",
                    fieldId: "makeThumbnailUrl",
                    type: "text",
                    label: "MakeThumbnailUrl (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "combinedPrice",
                    fieldId: "combinedPrice",
                    type: "number",
                    label: "CombinedPrice (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "carsCombinedEpaMpg",
                    fieldId: "carsCombinedEpaMpg",
                    type: "number",
                    label: "CombinedEpaMPG (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "horsePowerVal",
                    fieldId: "horsePowerVal",
                    type: "number",
                    label: "HorsePowerVal (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugMakeModel",
                    fieldId: "slugMakeModel",
                    type: "text",
                    label: "SlugMakeModel (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "retainedValue",
                    fieldId: "retainedValue",
                    type: "text",
                    label: "RetainedValue (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "standardTires",
                    fieldId: "standardTires",
                    type: "text",
                    label: "StandardTires (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "specifications",
                    fieldId: "specifications",
                    type: "object",
                    label: "Specifications",
                    renderer: { name: "object" },
                    settings: {
                        layout: [
                            ["trimName", "bodyStyle", "driveTrain"],
                            ["seatingCapacity", "specWidth", "specLength"],
                            ["specHeight", "specWheelase", "frontHeadroom"],
                            ["rearHeadroom", "frontShoulderRoom", "rearShoulderRoom"],
                            ["frontLegroom", "rearLegroom", "groundClearance"],
                            ["curbWeight", "cargoCapacity", "specGvwr"],
                            ["engineName", "specHorsepower", "specTonnage"],
                            ["specTorque", "fuelType", "stdEpaMpg"],
                            ["transmissionName", "transmissionType", "towingCapacity"],
                            ["drivingRange", "cylinderConfiguration", "numberOfCylinders"],
                            ["stdMpgWithUnits", "heroLabel1", "heroValue1"],
                            ["payloadCapacity", "vehicleClass", "engineType"]
                        ],
                        fields: [
                            {
                                id: "trimName",
                                fieldId: "trimName",
                                type: "text",
                                label: "TrimName",
                                multipleValues: false,
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "bodyStyle",
                                fieldId: "bodyStyle",
                                multipleValues: false,
                                type: "text",
                                label: "BodyStyle",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "driveTrain",
                                fieldId: "driveTrain",
                                multipleValues: false,
                                type: "text",
                                label: "Drivetrain",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "seatingCapacity",
                                fieldId: "seatingCapacity",
                                multipleValues: false,
                                type: "text",
                                label: "SeatingCapacity",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specWidth",
                                fieldId: "specWidth",
                                multipleValues: false,
                                type: "text",
                                label: "Width",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specLength",
                                fieldId: "specLength",
                                multipleValues: false,
                                type: "text",
                                label: "Length",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specHeight",
                                fieldId: "specHeight",
                                multipleValues: false,
                                type: "text",
                                label: "Height",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specWheelase",
                                fieldId: "specWheelbase",
                                type: "text",
                                multipleValues: false,
                                label: "Wheelbase",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "frontHeadroom",
                                fieldId: "frontHeadroom",
                                type: "text",
                                multipleValues: false,
                                label: "FrontHeadroom",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rearHeadroom",
                                fieldId: "rearHeadroom",
                                type: "text",
                                multipleValues: false,
                                label: "RearHeadroom",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "frontShoulderRoom",
                                fieldId: "frontShoulderRoom",
                                type: "text",
                                multipleValues: false,
                                label: "FrontShoulderRoom",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rearShoulderRoom",
                                fieldId: "rearShoulderRoom",
                                type: "text",
                                multipleValues: false,
                                label: "RearShoulderRoom",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "frontLegroom",
                                fieldId: "frontLegroom",
                                type: "text",
                                multipleValues: false,
                                label: "FrontLegroom",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rearLegroom",
                                fieldId: "rearLegroom",
                                type: "text",
                                multipleValues: false,
                                label: "RearLegroom",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "groundClearance",
                                fieldId: "groundClearance",
                                type: "text",
                                multipleValues: false,
                                label: "GroundClearance",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "curbWeight",
                                fieldId: "curbWeight",
                                type: "text",
                                multipleValues: false,
                                label: "CurbWeight",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cargoCapacity",
                                fieldId: "cargoCapacity",
                                type: "text",
                                multipleValues: false,
                                label: "CargoCapacity",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specGvwr",
                                fieldId: "specGvwr",
                                type: "text",
                                multipleValues: false,
                                label: "GVWR",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "payloadCapacity",
                                fieldId: "payloadCapacity",
                                type: "text",
                                multipleValues: false,
                                label: "PayloadCapacity",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "towingCapacity",
                                fieldId: "towingCapacity",
                                type: "text",
                                multipleValues: false,
                                label: "TowingCapacity",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "engineName",
                                fieldId: "engineName",
                                type: "text",
                                multipleValues: false,
                                label: "EngineName",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specHorsepower",
                                fieldId: "specHorsepower",
                                type: "text",
                                multipleValues: false,
                                label: "Horsepower",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specTorque",
                                fieldId: "specTorque",
                                type: "text",
                                multipleValues: false,
                                label: "Torque",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "fuelType",
                                fieldId: "fuelType",
                                multipleValues: false,
                                type: "text",
                                label: "FuelType",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "stdEpaMpg",
                                fieldId: "stdEpaMpg",
                                type: "text",
                                multipleValues: false,
                                label: "StdEpaMpg",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "transmissionName",
                                fieldId: "transmissionName",
                                type: "text",
                                multipleValues: false,
                                label: "TransmissionName",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "transmissionType",
                                fieldId: "transmissionType",
                                type: "text",
                                multipleValues: false,
                                label: "TransmissionType",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "drivingRange",
                                fieldId: "drivingRange",
                                type: "text",
                                multipleValues: false,
                                label: "DrivingRange",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cylinderConfiguration",
                                fieldId: "cylinderConfiguration",
                                type: "text",
                                multipleValues: false,
                                label: "CylinderConfiguration",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "numberOfCylinders",
                                fieldId: "numberOfCylinders",
                                type: "text",
                                multipleValues: false,
                                label: "NumberOfCylinders",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specTonnage",
                                fieldId: "specTonnage",
                                type: "text",
                                multipleValues: false,
                                label: "Tonnage",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "stdMpgWithUnits",
                                fieldId: "stdMpgWithUnits",
                                type: "text",
                                multipleValues: false,
                                label: "StdMpg With Units",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "heroLabel1",
                                fieldId: "heroLabel1",
                                type: "text",
                                multipleValues: false,
                                label: "Hero Label1",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "heroValue1",
                                fieldId: "heroValue1",
                                type: "text",
                                multipleValues: false,
                                label: "Hero Value1",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "vehicleClass",
                                fieldId: "vehicleClass",
                                type: "text",
                                multipleValues: false,
                                label: "VehicleClass",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "engineType",
                                fieldId: "engineType",
                                type: "text",
                                multipleValues: false,
                                label: "Engine Type",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "powertrains",
                    fieldId: "powertrains",
                    multipleValues: true,
                    label: "Powertrains (Non-Jato)",
                    renderer: { name: "objects" },
                    type: "object",
                    settings: {
                        layout: [["ptHorseower", "ptCityMpg", "ptHwyMpg"]],
                        fields: [
                            {
                                id: "ptHorseower",
                                fieldId: "ptHorseower",
                                type: "number",
                                multipleValues: false,
                                label: "Horsepower",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "ptCityMpg",
                                fieldId: "ptCityMpg",
                                type: "number",
                                multipleValues: false,
                                label: "CityMpg",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "ptHwyMpg",
                                fieldId: "ptHwyMpg",
                                type: "number",
                                multipleValues: false,
                                label: "HwyMpg",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "vehicleRankingClass",
                    fieldId: "vehicleRankingClass",
                    multipleValues: true,
                    label: "VehicleRankingClass (Non-Jato)",
                    renderer: { name: "objects" },
                    type: "object",
                    settings: {
                        layout: [
                            ["rankClass", "classTitle", "slugClassTitle", "classPosition"],
                            ["subClass", "subClassTitle", "slugSubclassTitle", "subClassPosition"],
                            [
                                "rankWithinSubclass",
                                "vrPerformance",
                                "fuelEconomy",
                                "techInnovation"
                            ],
                            ["vrValue", "vrSafety", "overallScore", "isVehicleShow"],
                            [
                                "isRankShow",
                                "toolTipPerformance",
                                "toolTipFuelEconomy",
                                "toolTipTechInnovation"
                            ],
                            [
                                "toolTipValue",
                                "toolTipOverallScore",
                                "classSlugRedirect",
                                "classThumbnailUrl"
                            ],
                            [
                                "associatedBody",
                                "topRankingTrophyImage",
                                "isRankingSubclass",
                                "classThumbnailRolloverUrl"
                            ],
                            ["bestClassImageUrl", "isMakeBodyStyleVehicleShow"]
                        ],
                        fields: [
                            {
                                id: "rankClass",
                                fieldId: "rankClass",
                                type: "text",
                                multipleValues: false,
                                label: "RankClass",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "classTitle",
                                fieldId: "classTitle",
                                type: "text",
                                multipleValues: false,
                                label: "ClassTitle",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "slugClassTitle",
                                fieldId: "slugClassTitle",
                                type: "text",
                                multipleValues: false,
                                label: "SlugClassTitle",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "classPosition",
                                fieldId: "classPosition",
                                type: "number",
                                multipleValues: false,
                                label: "ClassPosition",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "subClass",
                                fieldId: "subClass",
                                type: "text",
                                multipleValues: false,
                                label: "Subclass",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "subClassTitle",
                                fieldId: "subClassTitle",
                                type: "text",
                                multipleValues: false,
                                label: "SubclassTitle",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "slugSubclassTitle",
                                fieldId: "slugSubclassTitle",
                                type: "text",
                                multipleValues: false,
                                label: "SlugSubclassTitle",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "subClassPosition",
                                fieldId: "subClassPosition",
                                type: "number",
                                multipleValues: false,
                                label: "SubclassPosition",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rankWithinSubclass",
                                fieldId: "rankWithinSubclass",
                                type: "number",
                                multipleValues: false,
                                label: "RankWithinSubclass",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "vrPerformance",
                                fieldId: "vrPerformance",
                                type: "number",
                                multipleValues: false,
                                label: "Performance",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "fuelEconomy",
                                fieldId: "fuelEconomy",
                                type: "number",
                                multipleValues: false,
                                label: "FuelEconomy",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "techInnovation",
                                fieldId: "techInnovation",
                                type: "number",
                                multipleValues: false,
                                label: "TechInnovation",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "vrValue",
                                fieldId: "vrValue",
                                type: "number",
                                multipleValues: false,
                                label: "Value",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "vrSafety",
                                fieldId: "vrSafety",
                                type: "number",
                                multipleValues: false,
                                label: "Safety",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "overallScore",
                                fieldId: "overallScore",
                                type: "number",
                                multipleValues: false,
                                label: "OverallScore",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "isVehicleShow",
                                fieldId: "isVehicleShow",
                                type: "number",
                                multipleValues: false,
                                label: "IsVehicleShow",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "isRankShow",
                                fieldId: "isRankShow",
                                type: "number",
                                multipleValues: false,
                                label: "IsRankShow",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "toolTipPerformance",
                                fieldId: "toolTipPerformance",
                                type: "text",
                                multipleValues: false,
                                label: "ToolTipPerformance",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "toolTipFuelEconomy",
                                fieldId: "toolTipFuelEconomy",
                                type: "text",
                                multipleValues: false,
                                label: "ToolTipFuelEconomy",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "toolTipTechInnovation",
                                fieldId: "toolTipTechInnovation",
                                type: "text",
                                multipleValues: false,
                                label: "ToolTipTechInnovation",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "toolTipValue",
                                fieldId: "toolTipValue",
                                type: "text",
                                multipleValues: false,
                                label: "ToolTipValue",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "toolTipOverallScore",
                                fieldId: "toolTipOverallScore",
                                type: "text",
                                multipleValues: false,
                                label: "ToolTipOverallScore",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "classSlugRedirect",
                                fieldId: "classSlugRedirect",
                                type: "text",
                                multipleValues: false,
                                label: "ClassSlugRedirect",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "classThumbnailUrl",
                                fieldId: "classThumbnailUrl",
                                type: "text",
                                multipleValues: false,
                                label: "ClassThumbnailUrl",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "associatedBody",
                                fieldId: "associatedBody",
                                type: "number",
                                multipleValues: false,
                                label: "AssociatedBody",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "topRankingTrophyImage",
                                fieldId: "topRankingTrophyImage",
                                type: "text",
                                multipleValues: false,
                                label: "TopRankingTrophyImage",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "isRankingSubclass",
                                fieldId: "isRankingSubclass",
                                type: "number",
                                multipleValues: false,
                                label: "IsRankingSubclass",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "classThumbnailRolloverUrl",
                                fieldId: "classThumbnailRolloverUrl",
                                type: "text",
                                multipleValues: false,
                                label: "ClassThumbnailRolloverUrl",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "bestClassImageUrl",
                                fieldId: "bestClassImageUrl",
                                type: "text",
                                multipleValues: false,
                                label: "BestClassImageUrl",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "isMakeBodyStyleVehicleShow",
                                fieldId: "isMakeBodyStyleVehicleShow",
                                type: "number",
                                multipleValues: false,
                                label: "IsMakeBodyStyleVehicleShow",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "warranty",
                    fieldId: "warranty",
                    type: "object",
                    label: "Warranty",
                    renderer: { name: "object" },
                    settings: {
                        layout: [
                            ["fullWarrantyMiles", "fullWarrantyMonths", "powertrainWarrantyMiles"],
                            [
                                "powertrainWarrantyMonths",
                                "maintenanceWarrantyMiles",
                                "maintenanceWarrantyMonths"
                            ],
                            ["roadsideWarrantyMiles", "roadsideWarrantyMonths"],
                            ["corrosionWarrantyMiles", "corrosionWarrantyMonths"]
                        ],
                        fields: [
                            {
                                id: "fullWarrantyMiles",
                                fieldId: "fullWarrantyMiles",
                                type: "text",
                                multipleValues: false,
                                label: "FullWarrantyMiles",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "fullWarrantyMonths",
                                fieldId: "fullWarrantyMonths",
                                type: "text",
                                multipleValues: false,
                                label: "FullWarrantyMonths",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "powertrainWarrantyMiles",
                                fieldId: "powertrainWarrantyMiles",
                                type: "text",
                                multipleValues: false,
                                label: "PowertrainWarrantyMiles",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "powertrainWarrantyMonths",
                                fieldId: "powertrainWarrantyMonths",
                                type: "text",
                                multipleValues: false,
                                label: "PowertrainWarrantyMonths",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "maintenanceWarrantyMiles",
                                fieldId: "maintenanceWarrantyMiles",
                                type: "text",
                                multipleValues: false,
                                label: "MaintenanceWarrantyMiles",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "maintenanceWarrantyMonths",
                                fieldId: "maintenanceWarrantyMonths",
                                type: "text",
                                multipleValues: false,
                                label: "MaintenanceWarrantyMonths",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "roadsideWarrantyMiles",
                                fieldId: "roadsideWarrantyMiles",
                                type: "text",
                                multipleValues: false,
                                label: "RoadsideWarrantyMiles",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "roadsideWarrantyMonths",
                                fieldId: "roadsideWarrantyMonths",
                                type: "text",
                                multipleValues: false,
                                label: "RoadsideWarrantyMonths",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "corrosionWarrantyMiles",
                                fieldId: "corrosionWarrantyMiles",
                                type: "text",
                                multipleValues: false,
                                label: "CorrosionWarrantyMiles",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "corrosionWarrantyMonths",
                                fieldId: "corrosionWarrantyMonths",
                                type: "text",
                                multipleValues: false,
                                label: "CorrosionWarrantyMonths",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "pricing",
                    fieldId: "pricing",
                    type: "object",
                    label: "Pricing",
                    renderer: { name: "object" },
                    settings: {
                        layout: [
                            ["pricingInvoice", "pricingMsrp", "pricingDestination"],
                            ["priceEffectiveOn"]
                        ],
                        fields: [
                            {
                                id: "pricingInvoice",
                                fieldId: "pricingInvoice",
                                type: "number",
                                multipleValues: false,
                                label: "Invoice",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "pricingMsrp",
                                fieldId: "pricingMsrp",
                                type: "number",
                                multipleValues: false,
                                label: "MSRP",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "pricingDestination",
                                fieldId: "pricingDestination",
                                type: "number",
                                multipleValues: false,
                                label: "Destination",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "priceEffectiveOn",
                                fieldId: "priceEffectiveOn",
                                type: "text",
                                multipleValues: false,
                                label: "PriceEffectiveOn",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "safetyFeatures",
                    fieldId: "safetyFeatures",
                    type: "object",
                    label: "SafetyFeatures",
                    renderer: { name: "object" },
                    settings: {
                        layout: [
                            ["rearAirbag", "rearCurtainAirbag", "rearSideAirbag"],
                            ["driverAirbag", "passengerAirbag", "kneeAirbag"],
                            ["sideAirbag", "autoDimmingMirrors", "tractionControl"],
                            ["brakeAssist", "daytimeRunningLights", "frontFogLights"],
                            ["heatedOutsideMirrors", "heatedWiperWashers", "hillDescentControl"],
                            ["limitedSlipDifferential", "parkingDistanceControl", "rearFogLights"],
                            ["rearviewCamera", "stabilityControl", "theftDeterrentSystem"],
                            ["headCurtainAirbag"]
                        ],
                        fields: [
                            {
                                id: "rearAirbag",
                                fieldId: "rearAirbag",
                                type: "text",
                                multipleValues: false,
                                label: "RearAirbag",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rearCurtainAirbag",
                                fieldId: "rearCurtainAirbag",
                                type: "text",
                                multipleValues: false,
                                label: "RearCurtainAirbag",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rearSideAirbag",
                                fieldId: "rearSideAirbag",
                                type: "text",
                                multipleValues: false,
                                label: "RearSideAirbag",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "driverAirbag",
                                fieldId: "driverAirbag",
                                type: "text",
                                multipleValues: false,
                                label: "DriverAirbag",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "passengerAirbag",
                                fieldId: "passengerAirbag",
                                type: "text",
                                multipleValues: false,
                                label: "PassengerAirbag",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "kneeAirbag",
                                fieldId: "kneeAirbag",
                                type: "text",
                                multipleValues: false,
                                label: "KneeAirbag",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "sideAirbag",
                                fieldId: "sideAirbag",
                                type: "text",
                                multipleValues: false,
                                label: "SideAirbag",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "autoDimmingMirrors",
                                fieldId: "autoDimmingMirrors",
                                type: "text",
                                multipleValues: false,
                                label: "AutoDimmingMirrors",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "brakeAssist",
                                fieldId: "brakeAssist",
                                type: "text",
                                multipleValues: false,
                                label: "BrakeAssist",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "daytimeRunningLights",
                                fieldId: "daytimeRunningLights",
                                type: "text",
                                multipleValues: false,
                                label: "DaytimeRunningLights",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "frontFogLights",
                                fieldId: "frontFogLights",
                                type: "text",
                                multipleValues: false,
                                label: "FrontFogLights",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "heatedOutsideMirrors",
                                fieldId: "heatedOutsideMirrors",
                                type: "text",
                                multipleValues: false,
                                label: "HeatedOutsideMirrors",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "heatedWiperWashers",
                                fieldId: "heatedWiperWashers",
                                type: "text",
                                multipleValues: false,
                                label: "HeatedWiperWashers",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "hillDescentControl",
                                fieldId: "hillDescentControl",
                                type: "text",
                                multipleValues: false,
                                label: "HillDescentControl",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "limitedSlipDifferential",
                                fieldId: "limitedSlipDifferential",
                                type: "text",
                                multipleValues: false,
                                label: "LimitedSlipDifferential",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "parkingDistanceControl",
                                fieldId: "parkingDistanceControl",
                                type: "text",
                                multipleValues: false,
                                label: "ParkingDistanceControl",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rearFogLights",
                                fieldId: "rearFogLights",
                                type: "text",
                                multipleValues: false,
                                label: "RearFogLights",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rearviewCamera",
                                fieldId: "rearviewCamera",
                                type: "text",
                                multipleValues: false,
                                label: "RearviewCamera",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "stabilityControl",
                                fieldId: "stabilityControl",
                                type: "text",
                                multipleValues: false,
                                label: "StabilityControl",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "theftDeterrentSystem",
                                fieldId: "theftDeterrentSystem",
                                type: "text",
                                multipleValues: false,
                                label: "TheftDeterrentSystem",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "tractionControl",
                                fieldId: "tractionControl",
                                type: "text",
                                multipleValues: false,
                                label: "TractionControl",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "headCurtainAirbag",
                                fieldId: "headCurtainAirbag",
                                type: "text",
                                multipleValues: false,
                                label: "HeadCurtainAirbag",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "safetyRatings",
                    fieldId: "safetyRatings",
                    type: "object",
                    label: "SafetyRatings",
                    renderer: { name: "object" },
                    settings: {
                        layout: [["nhtsaRatingOverall", "nhtsaRatingRollover"]],
                        fields: [
                            {
                                id: "nhtsaRatingOverall",
                                fieldId: "nhtsaRatingOverall",
                                type: "text",
                                multipleValues: false,
                                label: "NhtsaRatingOverall",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "nhtsaRatingRollover",
                                fieldId: "nhtsaRatingRollover",
                                type: "text",
                                multipleValues: false,
                                label: "NhtsaRatingRollover",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "ownershipCosts",
                    fieldId: "ownershipCosts",
                    type: "object",
                    label: "Ownership Costs (Non-Jato)",
                    renderer: { name: "object" },
                    settings: {
                        layout: [
                            ["depreciationTotal", "financingTotal", "insuranceTotal"],
                            ["stateFeesTotal", "fuelTotal", "maintenanceTotal"],
                            ["repairsTotal", "total5YearOcCost", "total5YearOcCostLessHybrid"],
                            ["similarVehicles", "difference5YearCost", "hybridTax"],
                            ["valueRating"]
                        ],
                        fields: [
                            {
                                id: "depreciationTotal",
                                fieldId: "depreciationTotal",
                                type: "text",
                                multipleValues: false,
                                label: "DepreciationTotal",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "financingTotal",
                                fieldId: "financingTotal",
                                type: "text",
                                multipleValues: false,
                                label: "FinancingTotal",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "insuranceTotal",
                                fieldId: "insuranceTotal",
                                type: "text",
                                multipleValues: false,
                                label: "InsuranceTotal",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "stateFeesTotal",
                                fieldId: "stateFeesTotal",
                                type: "text",
                                multipleValues: false,
                                label: "StateFeesTotal",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "fuelTotal",
                                fieldId: "fuelTotal",
                                type: "text",
                                multipleValues: false,
                                label: "FuelTotal",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "maintenanceTotal",
                                fieldId: "maintenanceTotal",
                                type: "text",
                                multipleValues: false,
                                label: "MaintenanceTotal",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "repairsTotal",
                                fieldId: "repairsTotal",
                                type: "text",
                                multipleValues: false,
                                label: "RepairsTotal",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "total5YearOcCost",
                                fieldId: "total5YearOcCost",
                                type: "text",
                                multipleValues: false,
                                label: "Total5YearOcCost",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "total5YearOcCostLessHybrid",
                                fieldId: "total5YearOcCostLessHybrid",
                                type: "number",
                                multipleValues: false,
                                label: "Total5YearOcCostLessHybrid",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "similarVehicles",
                                fieldId: "similarVehicles",
                                type: "number",
                                multipleValues: false,
                                label: "SimilarVehicles",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "difference5YearCost",
                                fieldId: "difference5YearCost",
                                type: "number",
                                multipleValues: false,
                                label: "Difference5YearCost",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "hybridTax",
                                fieldId: "hybridTax",
                                type: "text",
                                multipleValues: false,
                                label: "HybridTax",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "valueRating",
                                fieldId: "valueRating",
                                type: "text",
                                multipleValues: false,
                                label: "ValueRating",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "cpoComparison",
                    fieldId: "cpoComparison",
                    type: "object",
                    label: "CPOComparison (Non-Jato)",
                    renderer: { name: "object" },
                    settings: {
                        layout: [
                            ["usedMonthly", "cpoMonthly", "usedMaintenanceRepairs"],
                            ["cpoMaintenanceRepairs", "usedTotalMonthly", "cpoTotalMonthly"],
                            ["cpoYear", "cpoMake", "modelName"],
                            ["usedCarTrim", "cpoPrice", "usedCarPrice"],
                            ["vehicleRating"]
                        ],
                        fields: [
                            {
                                id: "usedMonthly",
                                fieldId: "usedMonthly",
                                type: "number",
                                multipleValues: false,
                                label: "UsedMonthly",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoMonthly",
                                fieldId: "cpoMonthly",
                                type: "number",
                                multipleValues: false,
                                label: "CPOMonthly",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "usedMaintenanceRepairs",
                                fieldId: "usedMaintenanceRepairs",
                                type: "number",
                                multipleValues: false,
                                label: "UsedMaintenanceRepairs",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoMaintenanceRepairs",
                                fieldId: "cpoMaintenanceRepairs",
                                type: "number",
                                multipleValues: false,
                                label: "CPOMaintenanceRepairs",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "usedTotalMonthly",
                                fieldId: "usedTotalMonthly",
                                type: "number",
                                multipleValues: false,
                                label: "UsedTotalMonthly",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoTotalMonthly",
                                fieldId: "cpoTotalMonthly",
                                type: "number",
                                multipleValues: false,
                                label: "CPOTotalMonthly",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoYear",
                                fieldId: "cpoYear",
                                type: "number",
                                multipleValues: false,
                                label: "Year",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoMake",
                                fieldId: "cpoMake",
                                type: "text",
                                multipleValues: false,
                                label: "Make",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "modelName",
                                fieldId: "modelName",
                                type: "text",
                                multipleValues: false,
                                label: "ModelName",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "usedCarTrim",
                                fieldId: "usedCarTrim",
                                type: "text",
                                multipleValues: false,
                                label: "UsedCarTrim",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoPrice",
                                fieldId: "cpoPrice",
                                type: "text",
                                multipleValues: false,
                                label: "CPOPrice",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "usedCarPrice",
                                fieldId: "usedCarPrice",
                                type: "number",
                                multipleValues: false,
                                label: "UsedCarPrice",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "vehicleRating",
                                fieldId: "vehicleRating",
                                type: "text",
                                multipleValues: false,
                                label: "VehicleRating",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "historicalMotortrendScores",
                    fieldId: "historicalMotortrendScores",
                    type: "object",
                    label: "HistoricalMotortrendScores (Non-Jato)",
                    renderer: { name: "object" },
                    settings: {
                        layout: [
                            ["hmPerformance", "overallScore", "toolTipPerformance"],
                            ["toolTipOverallScore"]
                        ],
                        fields: [
                            {
                                id: "hmPerformance",
                                fieldId: "hmPerformance",
                                type: "number",
                                multipleValues: false,
                                label: "Performance",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "overallScore",
                                fieldId: "overallScore",
                                type: "number",
                                multipleValues: false,
                                label: "OverallScore",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "toolTipPerformance",
                                fieldId: "toolTipPerformance",
                                type: "text",
                                multipleValues: false,
                                label: "ToolTipPerformance",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "toolTipOverallScore",
                                fieldId: "toolTipOverallScore",
                                type: "text",
                                multipleValues: false,
                                label: "ToolTipOverallScore",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "recalls",
                    fieldId: "recalls",
                    multipleValues: true,
                    label: "Recalls (Non-Jato)",
                    renderer: { name: "objects" },
                    type: "object",
                    settings: {
                        layout: [
                            ["recallsCampNumber"],
                            ["makeText", "modelText", "yearText", "compName"],
                            ["mfgText", "recallsPotaff", "rcDate"],
                            ["descDefect", "consequenceDefect", "correctiveAction"]
                        ],
                        fields: [
                            {
                                id: "recallsCampNumber",
                                fieldId: "recallsCampNumber",
                                type: "text",
                                multipleValues: false,
                                label: "Campno",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "makeText",
                                fieldId: "makeText",
                                type: "text",
                                multipleValues: false,
                                label: "Maketxt",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "modelText",
                                fieldId: "modelText",
                                type: "text",
                                multipleValues: false,
                                label: "Modeltxt",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "yearText",
                                fieldId: "yearText",
                                type: "number",
                                multipleValues: false,
                                label: "Yeartxt",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "compName",
                                fieldId: "compName",
                                type: "text",
                                multipleValues: false,
                                label: "Compname",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "mfgText",
                                fieldId: "mfgText",
                                type: "text",
                                multipleValues: false,
                                label: "Mfgtxt",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "recallsPotaff",
                                fieldId: "recallsPotaff",
                                type: "number",
                                multipleValues: false,
                                label: "Potaff",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rcDate",
                                fieldId: "rcDate",
                                type: "text",
                                multipleValues: false,
                                label: "Rcdate",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "descDefect",
                                fieldId: "descDefect",
                                type: "text",
                                multipleValues: false,
                                label: "DescDefect",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "consequenceDefect",
                                fieldId: "consequenceDefect",
                                type: "text",
                                multipleValues: false,
                                label: "ConsequenceDefect",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "correctiveAction",
                                fieldId: "correctiveAction",
                                type: "text",
                                multipleValues: false,
                                label: "CorrectiveAction",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "carsRebates",
                    fieldId: "carsRebates",
                    multipleValues: true,
                    label: "Rebates (Non-Jato)",
                    renderer: { name: "objects" },
                    type: "object",
                    settings: {
                        layout: [
                            ["rebatesLow", "rebatesHigh", "rebateText"],
                            ["nationallyAvailable", "rebatesDescription", "rebatesExpDate"]
                        ],
                        fields: [
                            {
                                id: "rebatesExpDate",
                                fieldId: "rebatesExpDate",
                                type: "text",
                                multipleValues: false,
                                label: "ExpDate",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rebatesLow",
                                fieldId: "rebatesLow",
                                type: "number",
                                multipleValues: false,
                                label: "Low",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rebatesHigh",
                                fieldId: "rebatesHigh",
                                type: "number",
                                multipleValues: false,
                                label: "High",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rebateText",
                                fieldId: "rebateText",
                                type: "text",
                                multipleValues: false,
                                label: "RebateText",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "nationallyAvailable",
                                fieldId: "nationallyAvailable",
                                type: "number",
                                multipleValues: false,
                                label: "Nationally Available",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rebatesDescription",
                                fieldId: "rebatesDescription",
                                type: "text",
                                multipleValues: false,
                                label: "Description",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "carMatchMotortrendRankings",
                    fieldId: "carMatchMotortrendRankings",
                    multipleValues: true,
                    label: "CarMatchMotortrendRankings (Non-Jato)",
                    renderer: { name: "objects" },
                    type: "object",
                    settings: {
                        layout: [
                            ["carMatchYear"],
                            ["carMatchMake", "carMatchModel", "carMatchBody"],
                            ["carMatchSeats", "carMatchLuxury", "carMatchGreen"],
                            ["carMatchOffroad", "carMatchBudget", "totalPercentage"],
                            ["carMatchPriority", "carMatchEstimated", "carMatchUuId"],
                            ["featuredImage", "priceRange", "carMatchMpg"],
                            ["seatingCapacity", "carMatchHorsepower", "winnerDescription"],
                            ["rankWithinSubclass", "carMatchSubClassTitle"]
                        ],
                        fields: [
                            {
                                id: "carMatchYear",
                                fieldId: "carMatchYear",
                                type: "number",
                                multipleValues: false,
                                label: "Year",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "carMatchMake",
                                fieldId: "carMatchMake",
                                type: "text",
                                multipleValues: false,
                                label: "Make",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "carMatchModel",
                                fieldId: "carMatchModel",
                                type: "text",
                                multipleValues: false,
                                label: "Model",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "carMatchBody",
                                fieldId: "carMatchBody",
                                type: "text",
                                multipleValues: false,
                                label: "Body",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "carMatchSeats",
                                fieldId: "carMatchSeats",
                                type: "text",
                                multipleValues: false,
                                label: "Seats",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "carMatchLuxury",
                                fieldId: "carMatchLuxury",
                                type: "text",
                                multipleValues: false,
                                label: "Luxury",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "carMatchGreen",
                                fieldId: "carMatchGreen",
                                type: "text",
                                multipleValues: false,
                                label: "Green",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "carMatchOffroad",
                                fieldId: "carMatchOffroad",
                                type: "text",
                                multipleValues: false,
                                label: "Offroad",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "carMatchBudget",
                                fieldId: "carMatchBudget",
                                type: "text",
                                multipleValues: false,
                                label: "Budget",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "totalPercentage",
                                fieldId: "totalPercentage",
                                type: "number",
                                multipleValues: false,
                                label: "TotalPercentage",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "carMatchPriority",
                                fieldId: "carMatchPriority",
                                type: "number",
                                multipleValues: false,
                                label: "Priority",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "carMatchEstimated",
                                fieldId: "carMatchEstimated",
                                type: "number",
                                multipleValues: false,
                                label: "Estimated",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "carMatchUuId",
                                fieldId: "carMatchUuId",
                                type: "number",
                                multipleValues: false,
                                label: "Uuid",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "featuredImage",
                                fieldId: "featuredImage",
                                type: "text",
                                multipleValues: false,
                                label: "FeaturedImage",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "priceRange",
                                fieldId: "priceRange",
                                type: "text",
                                multipleValues: false,
                                label: "PriceRange",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "carMatchMpg",
                                fieldId: "carMatchMpg",
                                type: "text",
                                multipleValues: false,
                                label: "Mpg",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "seatingCapacity",
                                fieldId: "seatingCapacity",
                                type: "text",
                                multipleValues: false,
                                label: "SeatingCapacity",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "carMatchHorsepower",
                                fieldId: "carMatchHorsepower",
                                type: "text",
                                multipleValues: false,
                                label: "horsepower",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "winnerDescription",
                                fieldId: "winnerDescription",
                                type: "text",
                                multipleValues: false,
                                label: "WinnerDescription",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rankWithinSubclass",
                                fieldId: "rankWithinSubclass",
                                type: "number",
                                multipleValues: false,
                                label: "RankWithinSubclass",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "carMatchSubClassTitle",
                                fieldId: "carMatchSubClassTitle",
                                type: "text",
                                multipleValues: false,
                                label: "SubClassTitle",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "cpoProgram",
                    fieldId: "cpoProgram",
                    type: "object",
                    label: "CpoProgram (Non-Jato)",
                    renderer: { name: "object" },
                    settings: {
                        layout: [
                            ["cpoName", "cpoInspectionPoint", "cpoInspectionScore"],
                            ["cpoAgeMileage", "cpoWarranty", "cpoWarrantyDeductible"],
                            ["cpoWarrantyBbnc", "cpoWarrantyTransferable", "cpoWarrantyExtended"],
                            ["cpoRoadside", "cpoReturnExchange", "cpoFinancing"],
                            ["cpoLease", "cpoWebsite", "cpoCustomerServiceNumber"],
                            ["cpoParticipation", "cpoHistoryReport", "cpoAdditionalBenefits"],
                            ["cpoProgramOverview"]
                        ],
                        fields: [
                            {
                                id: "cpoName",
                                fieldId: "cpoName",
                                type: "text",
                                multipleValues: false,
                                label: "CpoName",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoInspectionPoint",
                                fieldId: "cpoInspectionPoint",
                                type: "text",
                                multipleValues: false,
                                label: "CPOInspectionPoint",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoInspectionScore",
                                fieldId: "cpoInspectionScore",
                                type: "number",
                                multipleValues: false,
                                label: "CPOInspectionScore",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoAgeMileage",
                                fieldId: "cpoAgeMileage",
                                type: "text",
                                multipleValues: false,
                                label: "CPOAgeMileage",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoWarranty",
                                fieldId: "cpoWarranty",
                                type: "text",
                                multipleValues: false,
                                label: "CPOWarranty",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoWarrantyDeductible",
                                fieldId: "cpoWarrantyDeductible",
                                type: "text",
                                multipleValues: false,
                                label: "CPOWarrantyDeductible",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoWarrantyBbnc",
                                fieldId: "cpoWarrantyBbnc",
                                type: "text",
                                multipleValues: false,
                                label: "CPOWarrantyBbnc",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoWarrantyTransferable",
                                fieldId: "cpoWarrantyTransferable",
                                type: "text",
                                multipleValues: false,
                                label: "CPOWarrantyTransferable",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoWarrantyExtended",
                                fieldId: "cpoWarrantyExtended",
                                type: "text",
                                multipleValues: false,
                                label: "CPOWarrantyExtended",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoRoadside",
                                fieldId: "cpoRoadside",
                                type: "text",
                                multipleValues: false,
                                label: "CPORoadside",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoReturnExchange",
                                fieldId: "cpoReturnExchange",
                                type: "text",
                                multipleValues: false,
                                label: "CPOReturnExchange",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoFinancing",
                                fieldId: "cpoFinancing",
                                type: "text",
                                multipleValues: false,
                                label: "CPOFinancing",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoLease",
                                fieldId: "cpoLease",
                                type: "text",
                                multipleValues: false,
                                label: "CPOLease",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoWebsite",
                                fieldId: "cpoWebsite",
                                type: "text",
                                multipleValues: false,
                                label: "CPOWebsite",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoCustomerServiceNumber",
                                fieldId: "cpoCustomerServiceNumber",
                                type: "text",
                                multipleValues: false,
                                label: "CPOCustomerServiceNumber",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoParticipation",
                                fieldId: "cpoParticipation",
                                type: "text",
                                multipleValues: false,
                                label: "CPOParticipation",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoHistoryReport",
                                fieldId: "cpoHistoryReport",
                                type: "number",
                                multipleValues: false,
                                label: "CPOHistoryReport",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoAdditionalBenefits",
                                fieldId: "cpoAdditionalBenefits",
                                type: "text",
                                multipleValues: false,
                                label: "CPOAdditionalBenefits",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cpoProgramOverview",
                                fieldId: "cpoProgramOverview",
                                type: "text",
                                multipleValues: false,
                                label: "CPOProgramOverview",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "realmpg",
                    fieldId: "realmpg",
                    type: "object",
                    label: "RealMpg (Non-Jato)",
                    renderer: { name: "object" },
                    settings: {
                        layout: [
                            ["realmpgAverageMpg", "realmpgAverageMpgCity", "realmpgAverageMpgHwy"]
                        ],
                        fields: [
                            {
                                id: "realmpgAverageMpg",
                                fieldId: "realmpgAverageMpg",
                                type: "number",
                                multipleValues: false,
                                label: "RealmpgAverageMpg",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "realmpgAverageMpgCity",
                                fieldId: "realmpgAverageMpgCity",
                                type: "number",
                                multipleValues: false,
                                label: "RealmpgAverageMpgCity",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "realmpgAverageMpgHwy",
                                fieldId: "realmpgAverageMpgHwy",
                                type: "number",
                                multipleValues: false,
                                label: "RealmpgAverageMpgHwy",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "hubs",
                    fieldId: "hubs",
                    multipleValues: true,
                    label: "Hubs (Non-Jato)",
                    renderer: { name: "objects" },
                    type: "object",
                    settings: {
                        layout: [["hubsImage", "makeModelHub", "hubsName", "hubsText"]],
                        fields: [
                            {
                                id: "hubsImage",
                                fieldId: "hubsImage",
                                type: "text",
                                multipleValues: false,
                                label: "Image",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "makeModelHub",
                                fieldId: "makeModelHub",
                                type: "number",
                                multipleValues: false,
                                label: "MakeModelHub",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "hubsName",
                                fieldId: "hubsName",
                                type: "text",
                                multipleValues: false,
                                label: "Name",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "hubsText",
                                fieldId: "hubsText",
                                type: "text",
                                multipleValues: false,
                                label: "Text",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                },
                {
                    id: "features",
                    fieldId: "features",
                    type: "object",
                    label: "Features",
                    multipleValues: false,
                    renderer: { name: "object" },
                    settings: {
                        layout: [["exteriorCategory"]],
                        fields: [
                            {
                                id: "exteriorCategory",
                                fieldId: "exteriorCategory",
                                type: "object",
                                label: "Exterior",
                                multipleValues: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: [["nameAndAvailability"]],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            multipleValues: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "interiorCategory",
                                fieldId: "interiorCategory",
                                type: "object",
                                label: "Interior",
                                multipleValues: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: [["nameAndAvailability"]],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            multipleValues: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "comfortAndConvenienceCategory",
                                fieldId: "comfortAndConvenienceCategory",
                                type: "object",
                                label: "Comfort & Convenience",
                                multipleValues: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: [["nameAndAvailability"]],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            multipleValues: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "dimensionsCategory",
                                fieldId: "dimensionsCategory",
                                type: "object",
                                label: "Dimensions",
                                multipleValues: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: [["nameAndAvailability"]],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            multipleValues: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "engineCategory",
                                fieldId: "engineCategory",
                                type: "object",
                                label: "Engine",
                                multipleValues: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: [["nameAndAvailability"]],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            multipleValues: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "fuelEconomyCategory",
                                fieldId: "fuelEconomyCategory",
                                type: "object",
                                label: "Fuel Economy",
                                multipleValues: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: [["nameAndAvailability"]],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            multipleValues: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "hybridAndElectricCategory",
                                fieldId: "hybridAndElectricCategory",
                                type: "object",
                                label: "Hybrid & Electric",
                                multipleValues: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: [["nameAndAvailability"]],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            multipleValues: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "infotainmentCategory",
                                fieldId: "infotainmentCategory",
                                type: "object",
                                label: "Infotainment",
                                multipleValues: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: [["nameAndAvailability"]],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            multipleValues: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "pricingCategory",
                                fieldId: "pricingCategory",
                                type: "object",
                                label: "Pricing",
                                multipleValues: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: [["nameAndAvailability"]],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            multipleValues: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "safetyAndDriverAssistCategory",
                                fieldId: "safetyAndDriverAssistCategory",
                                type: "object",
                                label: "Safety & Driver Assist",
                                multipleValues: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: [["nameAndAvailability"]],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            multipleValues: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "suspensionCategory",
                                fieldId: "suspensionCategory",
                                type: "object",
                                label: "Suspension",
                                multipleValues: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: [["nameAndAvailability"]],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            multipleValues: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "transmissionCategory",
                                fieldId: "transmissionCategory",
                                type: "object",
                                label: "Transmission",
                                multipleValues: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: [["nameAndAvailability"]],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            multipleValues: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "warrantyCategory",
                                fieldId: "warrantyCategory",
                                type: "object",
                                label: "Warranty",
                                multipleValues: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: [["nameAndAvailability"]],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            multipleValues: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ],
            layout: [
                ["carsVehicle"],
                ["isGood"],
                ["vehicleNmb", "carsUid", "carsDiscontinued"],
                ["carsMake", "carsModelName", "carsYear"],
                ["slugMake", "slugModelName", "slugTrimName"],
                ["baseVehicle", "releaseType", "newUsedBg"],
                ["manufacturerCd", "slugBodystyle", "makeFeaturedImage"],
                ["makeIcon", "makeDiscontinued", "oemUrl"],
                ["carsSubcategory", "slugSubcategory", "mainCategory"],
                ["slugMainCategory", "hybridElectricCategory", "slugHybridElectricCategory"],
                ["dieselCategory", "slugDieselCategory", "updatedOn"],
                ["vehicleStatus", "featuredImage", "priceRangeText"],
                ["propertyType", "marketingImage", "priceRangeValue"],
                ["ymmPriceRange", "bodyType", "bodyTypeText"],
                ["bodyTypeOrder", "secondaryBodyType", "secondaryBodyTypeText"],
                ["secondaryBodyTypeOrder", "priceRangeSlug", "latestYear"],
                ["ymmLowestPriceRange", "ymmMaxPriceRange", "makeThumbnailUrl"],
                ["combinedPrice", "carsCombinedEpaMpg", "horsePowerVal"],
                ["slugMakeModel", "retainedValue", "standardTires"],
                ["specifications"],
                ["powertrains"],
                ["vehicleRankingClass"],
                ["warranty"],
                ["pricing"],
                ["safetyFeatures"],
                ["safetyRatings"],
                ["ownershipCosts"],
                ["cpoComparison"],
                ["carsRebates"],
                ["historicalMotortrendScores"],
                ["recalls"],
                ["carMatchMotortrendRankings"],
                ["cpoProgram"],
                ["realmpg"],
                ["hubs"],
                ["features"]
            ],
            titleFieldId: "carsVehicle"
        })
    ];
};
