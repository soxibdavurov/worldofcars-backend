import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { CarType, CarStatus, CarLocation, CarFuelType } from '../../enums/car.enum';
import { CarLabel } from './car';

@InputType()
export class CarUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => CarType, { nullable: true })
	carType?: CarType;

	@IsOptional()
	@Field(() => CarStatus, { nullable: true })
	carStatus?: CarStatus;

	@IsOptional()
	@Field(() => CarLocation, { nullable: true })
	carLocation?: CarLocation;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	carAddress?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	carTitle?: string;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	carPrice?: number;

	@IsOptional()
	@Length(1, 50)
	@Field(() => String, { nullable: true })
	carBrand?: string;

	@IsOptional()
	@Length(1, 50)
	@Field(() => String, { nullable: true })
	carModel?: string;

	@IsOptional()
	@IsInt()
	@Min(1900)
	@Field(() => Int, { nullable: true })
	carYear?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	carMileage?: number;

	@IsOptional()
	@Field(() => CarFuelType, { nullable: true })
	carFuelType?: CarFuelType;

	@IsOptional()
	@Length(1, 50)
	@Field(() => String, { nullable: true })
	carEngineSize?: string;

	@IsOptional()
	@Length(1, 50)
	@Field(() => String, { nullable: true })
	carTransmission?: string;

	@IsOptional()
	@Length(1, 50)
	@Field(() => String, { nullable: true })
	carColor?: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	carSeats?: number;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	carFeatures?: string[];

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	carBarter?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	carRent?: boolean;

	@IsOptional()
	@Field(() => CarLabel, { nullable: true })
	carLabel?: CarLabel;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	carImages?: string[];

	@IsOptional()
	@Field(() => String, { nullable: true })
	carVideo?: string;

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	carDesc?: string;

	soldAt?: Date;
	deletedAt?: Date;
}
