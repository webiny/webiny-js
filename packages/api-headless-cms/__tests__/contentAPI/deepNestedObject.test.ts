import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { createCarsMutation, createInitializeModelMutation } from "./deepNestedObject/mutation";
import { createCarsModel } from "./deepNestedObject/model";
import { ContextPlugin } from "@webiny/api";
import { CmsContext } from "~/types";

const LIST_CARS_QUERY = `
    query ListCarsQuery($where: CarsListWhereInput, $sort: [CarsListSorter], $limit: Int, $after: String) {
        listCars(where: $where, sort: $sort, limit: $limit, after: $after) {
            data {
                id
                carsVehicle
            }
            error {
                message
                code
                data
            }
        }
    }
`;

const GET_CAR_QUERY = `
    query GetCarsQuery($revision: ID!) {
        getCars(revision: $revision) {
            data {
                id
                carsVehicle
            }
            error {
                message
                code
                data
            }
        }
    }
`;

interface Tracker {
    setData: (input: any) => void;
    data: any;
}
const onModelInitialize = (tracker: Tracker) => {
    return new ContextPlugin<CmsContext>(async context => {
        context.cms.onModelInitialize.subscribe(async ({ data }) => {
            tracker.setData(data);
        });
    });
};

describe("Cars Model Deep Nested Object Fields", () => {
    const tracker: Tracker = {
        setData: function (input) {
            this.data = input;
        },
        data: null
    };

    const handler = useGraphQLHandler({
        plugins: [...createCarsModel(), onModelInitialize(tracker)],
        path: "manage/en-US"
    });

    beforeEach(async () => {
        tracker.data = null;
    });

    it("should insert a large deeply nested record", async () => {
        const [result] = await handler.introspect();

        expect(result).toMatchObject({
            data: {
                __schema: {
                    types: expect.any(Array)
                }
            }
        });

        for (const type of result.data.__schema.types) {
            if (type.name !== "Cars") {
                continue;
            }
            expect(type).toMatchObject({
                name: "Cars",
                kind: "OBJECT"
            });
        }

        const trackerData = {
            test: true,
            failed: false
        };

        const [initializeModelResult] = await handler.invoke({
            body: {
                query: createInitializeModelMutation(),
                variables: {
                    modelId: "cars",
                    data: trackerData
                }
            }
        });

        expect(tracker).toEqual({
            data: trackerData,
            setData: expect.any(Function)
        });

        expect(initializeModelResult).toEqual({
            data: {
                initializeModel: {
                    data: true,
                    error: null
                }
            }
        });

        const [mutationResult] = await handler.invoke({
            body: {
                query: createCarsMutation(),
                variables: {}
            }
        });

        expect(mutationResult).toEqual({
            data: {
                createCars: {
                    data: {
                        id: expect.any(String),
                        carsVehicle: "Acura-ILX-2019--",
                        vehicleNmb: 709839120181004,
                        carsUid: 9007199254740991,
                        carsDiscontinued: 0,
                        carsMake: "Acura",
                        carsModelName: "ILX",
                        carsYear: 2019,
                        slugMake: "acura",
                        slugModelName: "ilx",
                        slugTrimName: "N/A",
                        baseVehicle: 0,
                        releaseType: "N/A",
                        newUsedBg: "N/A",
                        manufacturerCd: "DE2F3KJW",
                        slugBodystyle: "N/A",
                        makeFeaturedImage: "N/A",
                        makeIcon: "N/A",
                        makeDiscontinued: 0,
                        oemUrl: "N/A",
                        carsSubcategory: "N/A",
                        slugSubcategory: "N/A",
                        mainCategory: "N/A",
                        slugMainCategory: "N/A",
                        hybridElectricCategory: "N/A",
                        slugHybridElectricCategory: "N/A",
                        dieselCategory: "N/A",
                        slugDieselCategory: "N/A",
                        updatedOn: "20211215",
                        vehicleStatus: 0,
                        featuredImage: "N/A",
                        priceRangeText: "N/A",
                        propertyType: "N/A",
                        marketingImage: "N/A",
                        priceRangeValue: 0,
                        ymmPriceRange: "N/A",
                        bodyType: "Sedan",
                        bodyTypeText: "Sedan",
                        bodyTypeOrder: 0,
                        secondaryBodyType: "N/A",
                        secondaryBodyTypeText: "N/A",
                        secondaryBodyTypeOrder: 0,
                        priceRangeSlug: "N/A",
                        latestYear: 0,
                        ymmLowestPriceRange: 0,
                        ymmMaxPriceRange: 0,
                        makeThumbnailUrl: "N/A",
                        combinedPrice: 0,
                        carsCombinedEpaMpg: 0,
                        horsePowerVal: 0,
                        slugMakeModel: "N/A",
                        retainedValue: "N/A",
                        standardTires: "N/A",
                        specifications: {
                            trimName: "-",
                            bodyStyle: "Sedan",
                            driveTrain: "FWD",
                            seatingCapacity: "5",
                            specWidth: "70.6",
                            specLength: "182.2",
                            specHeight: "55.6",
                            specWheelbase: "105.1",
                            frontHeadroom: "38.0",
                            rearHeadroom: "35.9",
                            frontShoulderRoom: "55.6",
                            rearShoulderRoom: "53.6",
                            frontLegroom: "42.3",
                            rearLegroom: "34.0",
                            groundClearance: "N/A",
                            curbWeight: "3095",
                            cargoCapacity: "12.4",
                            specGvwr: "N/A",
                            engineName: "2.4L inline 4-cylinder",
                            specHorsepower: "201@6800",
                            specTonnage: "180@3600",
                            specTorque: "N/A",
                            fuelType: "Premium Unleaded",
                            stdEpaMpg: "24@34",
                            transmissionName:
                                "Sequential SportShift Dual Clutch Sequential Trans (dct)",
                            transmissionType: "Manual",
                            towingCapacity: "N/A",
                            drivingRange: "370",
                            cylinderConfiguration: "4",
                            numberOfCylinders: "in-line",
                            stdMpgWithUnits: "N/A",
                            heroLabel1: "N/A",
                            heroValue1: "N/A",
                            payloadCapacity: "N/A",
                            vehicleClass: "N/A"
                        },
                        features: {
                            exteriorCategory: {
                                nameAndAvailability: [
                                    "Front wheels : 17x7.0' Alloy",
                                    "Front tires (standard) : 215/45/VR17 All Seasons",
                                    "Front tires (optional) : 215/45/VR17 ",
                                    "Rear wheels : 17x7.0' Alloy",
                                    "Rear tires (standard) : 215/45/VR17 All Seasons",
                                    "Rear tires (optional) : 215/45/VR17 ",
                                    "Spare/Temporary Tire : Not Available",
                                    "Disc brakes : 4",
                                    "Ceramic brakes : Not Available",
                                    "Regenerative brakes : Not Available",
                                    "Chrome molding : Standard",
                                    "Mud flaps (front / rear) : Optional / Optional",
                                    "Trailer towing prep : Not Available",
                                    "Trailer hitch : Not Available",
                                    "Rear spoiler : Optional",
                                    "Roof spoiler : Not Available",
                                    "Side moulding : Optional",
                                    "Wheel moulding : Not Available",
                                    "Front door type (driver / passenger) : Front Hinged / Front Hinged",
                                    "Rear door type (driver / passenger) : Front Hinged / Front Hinged",
                                    "Hands free rear doors (rear driver / rear passenger) : No / No",
                                    "Headlights : LED ",
                                    "Front fog lights : Optional",
                                    "Puddle Lights : Not Available",
                                    "Rear fog lights : Not Available",
                                    "Side mirror indicator lights (driver / passenger) : Standard / Standard",
                                    "Cornering lights : Not Available",
                                    "Roof rails : Not Available",
                                    "Underbody protection : Not Available",
                                    "Privacy glass : Not Available"
                                ]
                            },
                            interiorCategory: {
                                nameAndAvailability: [
                                    "Seating capacity : 5",
                                    "Seating configuration : 2+3",
                                    "Seat main upholstery  : Synthetic Leather",
                                    "Seat additional upholstery  : Synthetic Leather",
                                    "Steering wheel trim : Leather Covered",
                                    "Dashboard trim : Alloy & Synthetic Leather",
                                    "Center console trim : Alloy Look",
                                    "Front driver seat type : Bucket",
                                    "Front passenger seat type : Bucket",
                                    "Rear seat type : Bench",
                                    "Third row seats : Not Available",
                                    "Booster seats (rear / third row) : Not Available / Not Available",
                                    "Dash console storage : Standard",
                                    "Center console storage : Standard",
                                    "Overhead console storage : Not Available",
                                    "Front sunroof : Standard",
                                    "Rear sunroof : Not Available",
                                    "Front to rear sunroof : Not Available",
                                    "Glass roof : Not Available",
                                    "Cupholders (front / rear) : Standard / Standard",
                                    "Armrest (front / rear) : Standard / Standard",
                                    "Reading lights (front / rear) : Standard / Not Available",
                                    "12V power outlet (front / rear / cargo) : Standard / Not Available / Not Available",
                                    "Hands free trunk release : Not Available",
                                    "Ashtray (front / rear) : Not Available / Not Available",
                                    "Lighter (front / rear) : Not Available / Not Available",
                                    "Vanity mirror (driver / passenger) : Standard / Standard",
                                    "Passenger grab handles : Standard",
                                    "Cargo area cover : Not Available"
                                ]
                            },
                            comfortAndConvenienceCategory: {
                                nameAndAvailability: [
                                    "Electronic parking brake : Not Available",
                                    "Automatic trunk/hatch closing : Not Available ",
                                    "Remote trunk/hatch release : Standard",
                                    "Cruise control : Standard Adaptive Cruise Control (ACC)",
                                    "Adaptive cruise control : Yes",
                                    "Air conditioning : Standard",
                                    "Automatic recirculation  : Not Available",
                                    "Climate control zones : 2",
                                    "Climate control type : Auto",
                                    "Air filter / carbon filter : Standard / Not Available",
                                    "Rear climate control : Not Available",
                                    "Neck warmer : Not Available",
                                    "Coming home device : Not Available",
                                    "Garage door opener : Not Available",
                                    "Memorized adjustment : Not Available",
                                    "Smart key : Standard",
                                    "External temperature display : Standard",
                                    "Compass display : Standard",
                                    "Trip computer : Standard",
                                    "Wiper de-icer : Not Available",
                                    "Service interval indicator : Not Available",
                                    "Power door locks : Standard",
                                    "Automatic door locking : Yes",
                                    "Front sunroof operation : Remote",
                                    "Power adjustable front seats (driver / passenger) : Standard / Not Available",
                                    "Number of front seat power adjustments (driver / passenger) : 4 / -",
                                    "Heated front seats (driver / passenger) : Standard / Standard",
                                    "Ventilated front seats (driver / passenger) : Not Available / Not Available",
                                    "Climate controlled front seats (driver / passenger) : Not Available / Not Available",
                                    "Massaging front seats (driver / passenger) : Not Available / Not Available",
                                    "Active bolstering front seats (driver / passenger) : Not Available / Not Available",
                                    "Front seat height adjustment (driver / passenger) : Electric / -",
                                    "Front seat lumbar adjustment (driver / passenger) : Electric / -",
                                    "Front seat reclining adjustment (driver / passenger) : Electric / Manual",
                                    "Front seat sliding adjustment (driver / passenger) : Electric / Manual",
                                    "Front seat tilt adjustment (driver / passenger) : Electric / -",
                                    "Power adjustable rear seats : Not Available",
                                    "Number of rear seat power adjustments : 0",
                                    "Heated rear seats : Not Available",
                                    "Ventilated rear seats : Not Available",
                                    "Climate controlled rear seats : Not Available",
                                    "Massaging rear seats : Not Available",
                                    "Folding rear seat type : One-piece",
                                    "Power folding rear seats : Not Available",
                                    "Rear seat ski hatch : Not Available",
                                    "Removable rear seats : Not Available",
                                    "Power adjustable steering wheel : Standard",
                                    "Cargo area light : Standard",
                                    "Steering wheel adjustment (height / telescopic / easy entry) : Standard / Standard / Not Available",
                                    "Heated steering wheel : Not Available",
                                    "Multi-function steering wheel : Standard",
                                    "Auto-dimming rear view mirror : Not Available",
                                    "Auto-dimming door mirrors (driver / passenger) : Not Available / Not Available",
                                    "Power adjustable door mirrors (driver / passenger) : Standard / Standard",
                                    "Heated door mirrors (driver / passenger) : Standard / Standard",
                                    "Door mirror tilt for reversing (driver / passenger) : Not Installed / Not Installed",
                                    "Heated door panels (front / rear) : Not Available / Not Available",
                                    "Heated windshield : Not Available",
                                    "Panoramic windshield : Not Available",
                                    "Intermittent windshield wiper type : Variable",
                                    "Rain sensing windshield wipers  : Not Available",
                                    "Rear window wiper (constant / intermittent) : Not Available / Not Available",
                                    "Rear Window Sunshade : Not Available",
                                    "Power windows (front / rear) : Standard / Standard",
                                    "One-touch power windows (driver / passenger / rear) : Standard / Standard / Not Available",
                                    "Power sliding rear window : Not Available",
                                    "Dusk sensing headlights : Standard",
                                    "Automatic high beams : Not Available",
                                    "Fragrance diffuser : Not Available"
                                ]
                            },
                            dimensionsCategory: {
                                nameAndAvailability: [
                                    "Headroom (in) (front / rear) : 38.0 / 35.9",
                                    "Leg room (in) (front / rear) : 42.3 / 34.0",
                                    "Hip room (in) (front / rear) : 50.3 / 51.7",
                                    "Shoulder room (in) (front / rear) : 55.6 / 53.6",
                                    "Overall length (in) : 182.2",
                                    "Overall width (in) : 70.6",
                                    "Overall height (in) : 55.6",
                                    "Wheelbase (in) : 105.1",
                                    "Turning circle (ft) : 36.8",
                                    "Cargo capacity (cuft) : 12.4",
                                    "Curb weight (lbs) : 3095"
                                ]
                            },
                            engineCategory: {
                                nameAndAvailability: [
                                    "Engine : 2.4L inline 4-cylinder",
                                    "Displacement (cc) : 2354",
                                    "Bore mm x stroke mm : 87.0 x 99.0",
                                    "Compression ratio : 11.6",
                                    "Valves per cylinder : 4",
                                    "Valve gear type : i-VTEC Double Overhead Cam",
                                    "Variable valve timing : Yes",
                                    "Cylinder shutdown : Not Available ",
                                    "Compressor : Not Available ",
                                    "Horsepower : 201",
                                    "RPM for horsepower : 6800",
                                    "Torque (ft lbs) : 180",
                                    "RPM for torque : 3600",
                                    "Fuel type : Premium Unleaded",
                                    "Start/stop function : Not Available",
                                    "CO2 Emissions : 5.2 tons/year",
                                    "Total number of valves : 16"
                                ]
                            },
                            fuelEconomyCategory: {
                                nameAndAvailability: [
                                    "Tank capacity (gal) : 13.2",
                                    "Fuel Economy - City (MPG) : 24",
                                    "Fuel Economy - Highway (MPG) : 34",
                                    "Estimated Combined (MPG) : 28",
                                    "Estimated Vehicle range (mi) : 370"
                                ]
                            },
                            hybridAndElectricCategory: {
                                nameAndAvailability: [
                                    "Plug-in : Not Available",
                                    "High power charger : Not Available"
                                ]
                            },
                            infotainmentCategory: {
                                nameAndAvailability: [
                                    "Navigation system : Not Available",
                                    "Navigation includes traffic info : Not Available",
                                    "Navigation via mobile phone : Not Available",
                                    "Built-in apps : Not Available",
                                    "Apps control : Standard",
                                    "Wireless charging pad : Not Available",
                                    "Bluetooth phone connection : Standard",
                                    "Bluetooth music streaming : Standard",
                                    "Telematics : Not Available",
                                    "Front entertainment display : Not Available",
                                    "Rear entertainment display (middle / back of front seats) : Not Available / Not Available",
                                    "Third row entertainment display (middle / back of rear seats) : Not Available / Not Available",
                                    "Internet connection : Not Available",
                                    "Speech text messaging : Standard",
                                    "Wifi network : Not Available",
                                    "Speakers : 6 ",
                                    "Subwoofer : Not Available",
                                    "Surround sound : Not Available",
                                    "In-dash DVD player : Not Available",
                                    "In-dash single CD player : Standard",
                                    "CD changer : Not Available",
                                    "Digital media card reader : Not Available",
                                    "Digital radio : Not Available",
                                    "Internet radio : Not Available",
                                    "Satellite radio : Optional",
                                    "Wireless headphones : Not Available",
                                    "AUX connection (front / rear) : Standard / Not Available",
                                    "USB connection (front / rear) : Standard / Not Available",
                                    "iPod/iPhone connection (front / rear) : Not Available / Not Available",
                                    "Game console connection (front / rear) : Not Available / Not Available",
                                    "HDMI connection (front / rear) : Not Available / Not Available",
                                    "Remote audio control : Steering Wheel Mounted",
                                    "Voice activation : Standard",
                                    "Voice activation system : HandsFreeLink",
                                    "Multi-function display screen : Not Available",
                                    "Touch screen : Standard",
                                    "Android Auto compatible : Not Available",
                                    "Apple CarPlay compatible : Not Available",
                                    "MirrorLink mobile integration : Not Available",
                                    "Symbian Belle mobile integration : Not Available"
                                ]
                            },
                            pricingCategory: {
                                nameAndAvailability: [
                                    "MSRP : 25900.00",
                                    "Invoice : 24617.07",
                                    "Delivery : 995.00"
                                ]
                            },
                            safetyAndDriverAssistCategory: {
                                nameAndAvailability: [
                                    "Stability control : Vehicle Stability Assist (VSA®), Standard ",
                                    "Trailer hitch assist : Not Available",
                                    "Trailer brake control : Not Available",
                                    "ABS : Standard",
                                    "Brake assist : Standard",
                                    "Cornering brake control : Not Available",
                                    "Electronic brake distribution : Standard",
                                    "Hill holder : Standard ",
                                    "Driver selectable modes  : Not Available ",
                                    "Blind spot warning sensor : Not Available",
                                    "Front park assist : Not Available ",
                                    "Rear park assist : Not Available ",
                                    "Front parking distance sensors : Not Available ",
                                    "Rear parking distance sensors : Standard Multi View Rear Camera Camera, Optional Radar",
                                    "Side parking distance sensors : Not Available ",
                                    "Corner view camera : Not Available",
                                    "Surround view camera : Not Available ",
                                    "Camera display in rear view mirror : Not Available",
                                    "Trailer assist : Not Available",
                                    "Electronic traction control : Standard",
                                    "Fire extinguisher : Not Available",
                                    "Low tire pressure warning : Standard",
                                    "Content theft alarm : Standard",
                                    "Front airbags (driver / passenger) : Standard / Standard",
                                    "Side airbags (front / rear / third row) : Standard / Not Available / Not Available",
                                    "Side curtain airbags (front only / front and rear / all three rows) : Not Available / Standard / Not Available",
                                    "Knee airbags (driver / passenger) : Not Available / Not Available",
                                    "Anti submarining airbags (rear / third row) : Not Available / Not Available",
                                    "Pedestrian airbag : Not Available",
                                    "Dynamic steering : Standard Motion Adaptive EPS",
                                    "LATCH system : Standard",
                                    "Collision warning system : Standard Collision Mitigation Braking System™ (CMBS™)",
                                    "Collision warning system activates at low speed : Front",
                                    "Collision warning system activates seat belts : Yes",
                                    "Collision warning system includes automatic braking : Yes",
                                    "Pedestrian avoidance system : Standard",
                                    "Pedestrian audio warning system : Not Available ",
                                    "Lane departure warning : Standard",
                                    "Lane departure warning activates brakes : Yes",
                                    "Lane departure warning activates steering : Yes",
                                    "Night vision : Not Available",
                                    "Day Time Running Lights : Standard",
                                    "Power steering : Standard ",
                                    "Head Up Display : No",
                                    "Cross-traffic alert (front / rear) : Not Available / Not Available",
                                    "Overall crash rating (NHTSA) : 5",
                                    "Frontal crash rating (NHTSA) : 4",
                                    "Side impact crash rating (NHTSA) : 5",
                                    "Rollover crash rating (NHTSA) : 4"
                                ]
                            },
                            suspensionCategory: {
                                nameAndAvailability: [
                                    "Type (front / rear) : Strut / Multi-link",
                                    "Spring type (front / rear) : Coil / Coil",
                                    "Stabilizer bar (front / rear) : Standard / Standard",
                                    "Wheel dependence (front / rear) : Independent / Independent",
                                    "Suspension leveling (front / rear) : Not Available / Not Available",
                                    "Responsive suspension : Not Available ",
                                    "Driver selectable : Not Available",
                                    "Terrain type selection : Not Available "
                                ]
                            },
                            transmissionCategory: {
                                nameAndAvailability: [
                                    "Transmission Type : Manual",
                                    "Transmission Speeds : 8",
                                    "Description : Sequential SportShift Dual Clutch Sequential Trans (dct)",
                                    "Drive : FWD",
                                    "Locking differential  : Not Available",
                                    "Limited slip differential : Not Available",
                                    "Descent control system : Not Available"
                                ]
                            },
                            warrantyCategory: {
                                nameAndAvailability: [
                                    "Whole vehicle warranty months / (miles) : 48 / 50000",
                                    "Powertrain warranty months / (miles) : 72 / 70000",
                                    "Anti-corrosion warranty months / (mi) : 60 / Unlimited",
                                    "Paint warranty months / (mi) : 48 / 50000",
                                    "Roadside assistance months / (mi) : 48 / 50000"
                                ]
                            }
                        }
                    },
                    error: null
                }
            }
        });

        const [getResult] = await handler.invoke({
            body: {
                query: GET_CAR_QUERY,
                variables: {
                    revision: mutationResult.data.createCars.data.id
                }
            }
        });
        expect(getResult).toEqual({
            data: {
                getCars: {
                    data: {
                        id: mutationResult.data.createCars.data.id,
                        carsVehicle: "Acura-ILX-2019--"
                    },
                    error: null
                }
            }
        });

        const [listResult] = await handler.invoke({
            body: {
                query: LIST_CARS_QUERY
            }
        });

        expect(listResult).toEqual({
            data: {
                listCars: {
                    data: [
                        {
                            id: mutationResult.data.createCars.data.id,
                            carsVehicle: "Acura-ILX-2019--"
                        }
                    ],
                    error: null
                }
            }
        });

        const [listSpecificationsHeroLabelResult] = await handler.invoke({
            body: {
                query: LIST_CARS_QUERY,
                variables: {
                    where: {
                        specifications: {
                            heroLabel1: "N/A"
                        }
                    }
                }
            }
        });

        expect(listSpecificationsHeroLabelResult).toEqual({
            data: {
                listCars: {
                    data: [
                        {
                            id: mutationResult.data.createCars.data.id,
                            carsVehicle: "Acura-ILX-2019--"
                        }
                    ],
                    error: null
                }
            }
        });

        const [listSpecificationsHeroLabelNoResult] = await handler.invoke({
            body: {
                query: LIST_CARS_QUERY,
                variables: {
                    where: {
                        specifications: {
                            heroLabel1: "N/AB"
                        }
                    }
                }
            }
        });

        expect(listSpecificationsHeroLabelNoResult).toEqual({
            data: {
                listCars: {
                    data: [],
                    error: null
                }
            }
        });
    });
});
