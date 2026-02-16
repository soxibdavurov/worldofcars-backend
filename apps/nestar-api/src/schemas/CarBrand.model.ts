import { Schema } from 'mongoose';

const CarBrandSchema = new Schema(
	{
		value: {
			type: String,
			required: true,
			unique: true,
		},
		label: {
			type: String,
			required: true,
		},
		categoryLogo: {
			type: String,
			required: true,
		},
		categoryImage: {
			type: String,
		},
		sortOrder: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true, collection: 'carBrands' },
);

CarBrandSchema.index({ sortOrder: 1 });

export default CarBrandSchema;
