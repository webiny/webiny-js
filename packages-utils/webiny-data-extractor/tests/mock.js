export default {
	firstName: 'John',
	lastName: 'Doe',
	age: 30,
	enabled: true,
	company: {
		name: 'Webiny LTD',
		city: 'London',
		tags: [{key: 'one', label: 'One'}, {key: 'two', label: 'Two'}, {key: 'three', label: 'Three'}],
		image: {
			file: 'webiny.jpg',
			size: {width: 12.5, height: 44},
			visible: false
		}
	},
	subscription: {
		name: 'Free',
		price: 0,
		commitment: {
			expiresOn: 'never'
		}
	},
	meta: {
		createdBy: null,
		createdOn: new Date(),
		objects: [
			{
				type: 'cube',
				size: 'large',
				weight: 'heavy',
				colors: [
					{
						key: 'red',
						label: 'Red',
						comments: [
							{
								id: 1,
								text: 'Not bad!',
								score: 10
							},
							{
								id: 2,
								text: 'Red red red',
								score: 20
							}
						]
					},
					{
						key: 'blue',
						label: 'Blue',
						comments: [
							{
								id: 3,
								text: 'Like it!',
								score: 30
							},
							{
								id: 4,
								text: 'Blue ocean',
								score: 40
							},
							{
								id: 5,
								text: 'Modern!',
								score: 50
							}
						]
					},
					{
						key: 'green',
						label: 'Green',
						comments: [
							{
								id: 6,
								text: 'Nice!',
								score: 60
							},
							{
								id: 7,
								text: 'Too green...',
								score: 70
							}
						]
					}]
			},
			{
				type: 'sphere',
				size: 'medium',
				weight: 'medium-heavy',
				colors: [
					{
						key: 'black',
						label: 'Black',
						comments: [
							{
								id: 8,
								text: 'Looks black enough.',
								score: 80
							},
							{
								id: 9,
								text: 'It is what is is - black is black.',
								score: 90
							},
						]
					},
					{
						key: 'white',
						label: 'White',
						comments: [
							{
								id: 10,
								text: 'Looks white enough.',
								score: 100
							},
							{
								id: 11,
								text: 'It is what is is - white is white.',
								score: 110
							},
						]
					},
					{
						key: 'gray',
						label: 'Gray',
						comments: [
							{
								id: 12,
								text: 'Looks gray enough.',
								score: 120
							},
							{
								id: 13,
								text: 'It is what is is - gray is gray.',
								score: 130
							},
						]
					}]
			},
			{
				type: 'pyramid',
				size: 'small',
				weight: 'light',
				colors: [
					{
						key: 'purple',
						label: 'Purple',
						comments: [
							{
								id: 14,
								text: 'Looks purple enough.',
								score: 140
							},
							{
								id: 15,
								text: 'It is what is is - purple is purple.',
								score: 150
							},
						]
					},
					{
						key: 'orange',
						label: 'Orange',
						comments: [
							{
								id: 16,
								text: 'Looks orange enough.',
								score: 160
							},
							{
								id: 17,
								text: 'It is what is is - orange is orange.',
								score: 170
							},
						]
					}]
			}
		]
	},
	promised: new Promise(resolve => {
		setTimeout(() => {
			resolve(100);
		}, 5);
	})
};