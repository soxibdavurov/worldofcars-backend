import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min, IsInt, IsIn } from 'class-validator';
import { CarType, CarLocation, CarFuelType } from '../../enums/car.enum';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { availableCarSorts } from '../../config';
import { CarLabel } from './car';

@InputType()
export class CarInput {
	@IsNotEmpty()
	@Field(() => CarType)
	carType: CarType;

	@IsNotEmpty()
	@Field(() => CarLocation)
	carLocation: CarLocation;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	carAddress: string;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	carTitle: string;

	@IsNotEmpty()
	@Field(() => Number)
	carPrice: number;

	@IsNotEmpty()
	@Length(1, 50)
	@Field(() => String)
	carBrand: string;

	@IsNotEmpty()
	@Length(1, 50)
	@Field(() => String)
	carModel: string;

	@IsNotEmpty()
	@IsInt()
	@Min(1900)
	@Field(() => Int)
	carYear: number;

	@IsNotEmpty()
	@Min(0)
	@Field(() => Number)
	carMileage: number;

	@IsNotEmpty()
	@Field(() => CarFuelType)
	carFuelType: CarFuelType;

	@IsNotEmpty()
	@Length(1, 50)
	@Field(() => String)
	carEngineSize: string;

	@IsNotEmpty()
	@Length(1, 50)
	@Field(() => String)
	carTransmission: string;

	@IsNotEmpty()
	@Length(1, 50)
	@Field(() => String)
	carColor: string;

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

	@IsNotEmpty()
	@Field(() => [String])
	carImages: string[];

	@IsOptional()
	@Field(() => String, { nullable: true })
	carVideo?: string;

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	carDesc?: string;

	memberId?: ObjectId;
}

@InputType()
export class CarPricesRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class CarYearsRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class CarMileageRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class CarPeriodsRange {
	@Field(() => Date)
	start: Date;

	@Field(() => Date)
	end: Date;
}

@InputType()
class CarInquirySearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@Field(() => [CarLocation], { nullable: true })
	locationList?: CarLocation[];

	@IsOptional()
	@Field(() => [CarType], { nullable: true })
	typeList?: CarType[];

	@IsOptional()
	@Field(() => [String], { nullable: true })
	brandList?: string[];

	@IsOptional()
	@Field(() => [CarFuelType], { nullable: true })
	fuelTypeList?: CarFuelType[];

	@IsOptional()
	@Field(() => CarPricesRange, { nullable: true })
	pricesRange?: CarPricesRange;

	@IsOptional()
	@Field(() => CarYearsRange, { nullable: true })
	yearsRange?: CarYearsRange;

	@IsOptional()
	@Field(() => CarMileageRange, { nullable: true })
	mileageRange?: CarMileageRange;

	@IsOptional()
	@Field(() => CarPeriodsRange, { nullable: true })
	periodsRange?: CarPeriodsRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class CarsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableCarSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => CarInquirySearch)
	search: CarInquirySearch;
}

@InputType()
class AgentCarsInquirySearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;
}

@InputType()
export class AgentCarsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableCarSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => AgentCarsInquirySearch, { nullable: true })
	search?: AgentCarsInquirySearch;
}
