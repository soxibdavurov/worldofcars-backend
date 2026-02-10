import { Schema } from 'mongoose';
import { CarType, CarStatus, CarLocation, CarFuelType } from '../libs/enums/car.enum';

const CarSchema = new Schema(
	{
		carType: {
			type: String,
			enum: CarType,
			required: true,
		},

		carStatus: {
			type: String,
			enum: CarStatus,
			default: CarStatus.ACTIVE,
		},

		carLocation: {
			type: String,
			enum: CarLocation,
			required: true,
		},

		carAddress: {
			type: String,
			required: true,
		},

		carTitle: {
			type: String,
			required: true,
		},

		carPrice: {
			type: Number,
			required: true,
		},

		carBrand: {
			type: String,
			required: true,
		},

		carModel: {
			type: String,
			required: true,
		},

		carYear: {
			type: Number,
			required: true,
		},

		carMileage: {
			type: Number,
			required: true,
		},

		carFuelType: {
			type: String,
			enum: CarFuelType,
			required: true,
		},

		carEngineSize: {
			type: String,
		},

		carTransmission: {
			type: String,
		},

		carColor: {
			type: String,
		},

		carSeats: {
			type: Number,
		},

		carFeatures: {
			type: [String],
		},

		carBarter: {
			type: Boolean,
			default: false,
		},

		carRent: {
			type: Boolean,
			default: false,
		},

		carLabel: {
			text: {
				type: String,
			},
			icon: {
				type: String,
			},
			class: {
				type: String,
			},
		},

		carViews: {
			type: Number,
			default: 0,
		},

		carLikes: {
			type: Number,
			default: 0,
		},

		carComments: {
			type: Number,
			default: 0,
		},

		carRank: {
			type: Number,
			default: 0,
		},

		carImages: {
			type: [String],
			required: true,
		},

		carVideo: {
			type: String,
		},

		carDesc: {
			type: String,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		soldAt: {
			type: Date,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'cars' },
);

CarSchema.index({ carType: 1, carLocation: 1, carTitle: 1, carPrice: 1 }, { unique: true });

export default CarSchema;
