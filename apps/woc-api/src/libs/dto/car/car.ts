import { Field, Int, ObjectType, InputType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { CarType, CarStatus, CarLocation, CarFuelType } from '../../enums/car.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
@InputType('CarLabelInput')
export class CarLabel {
	@Field(() => String, { nullable: true })
	text?: string;

	@Field(() => String, { nullable: true })
	icon?: string;

	@Field(() => String, { nullable: true })
	class?: string;
}

@ObjectType()
export class Car {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => CarType)
	carType: CarType;

	@Field(() => CarStatus)
	carStatus: CarStatus;

	@Field(() => CarLocation)
	carLocation: CarLocation;

	@Field(() => String)
	carAddress: string;

	@Field(() => String)
	carTitle: string;

	@Field(() => Number)
	carPrice: number;

	@Field(() => String)
	carBrand: string;

	@Field(() => String)
	carModel: string;

	@Field(() => Int)
	carYear: number;

	@Field(() => Number)
	carMileage: number;

	@Field(() => CarFuelType)
	carFuelType: CarFuelType;

	@Field(() => String, { nullable: true })
	carEngineSize?: string;

	@Field(() => String, { nullable: true })
	carTransmission?: string;

	@Field(() => String, { nullable: true })
	carColor?: string;

	@Field(() => Int, { nullable: true })
	carSeats?: number;

	@Field(() => [String], { nullable: true })
	carFeatures?: string[];

	@Field(() => Boolean, { nullable: true })
	carBarter?: boolean;

	@Field(() => Boolean, { nullable: true })
	carRent?: boolean;

	@Field(() => CarLabel, { nullable: true })
	carLabel?: CarLabel;

	@Field(() => Int)
	carViews: number;

	@Field(() => Int)
	carLikes: number;

	@Field(() => Int)
	carComments: number;

	@Field(() => Int)
	carRank: number;

	@Field(() => [String])
	carImages: string[];

	@Field(() => String, { nullable: true })
	carVideo?: string;

	@Field(() => String, { nullable: true })
	carDesc?: string;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Date, { nullable: true })
	soldAt?: Date;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date, { nullable: true })
	createdAt: Date;

	@Field(() => Date, { nullable: true })
	updatedAt: Date;

	/** from aggregation */
	@Field(() => Member, { nullable: true })
	memberData?: Member;

	/** from aggregation **/
	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class Cars {
	@Field(() => [Car])
	list: Car[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
