import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { CarService } from './car.service';
import { Cars, Car, CarLabel } from '../../libs/dto/car/car';
import {
	CarsInquiry,
	CarInput,
} from '../../libs/dto/car/car.input';
import { OrdinaryInquiry } from '../../libs/dto/property/property.input';
import { MemberType } from '../../libs/enums/member.enum';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { Roles } from '../auth/decorators/roles.decorator';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { CarUpdate } from '../../libs/dto/car/car.update';
import { AuthGuard } from '../auth/guards/auth.guard';

@Resolver()
export class CarResolver {
	constructor(private readonly carService: CarService) { }

	@Roles(MemberType.ADMIN, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Car)
	public async createCar(
		@Args('input') input: CarInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Car> {
		console.log('Mutation: createCar');
		input.memberId = memberId;
		return await this.carService.createCar(input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Car)
	public async getCar(
		@Args('carId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Car> {
		console.log('Query: getCar');
		const carId = shapeIntoMongoObjectId(input);
		return await this.carService.getCar(memberId, carId);
	}

	@Roles(MemberType.ADMIN, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Car)
	public async updateCar(
		@Args('input') input: CarUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Car> {
		console.log('Mutation: updateCar');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.carService.updateCar(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Cars)
	public async getCars(
		@Args('input') input: CarsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Cars> {
		console.log('Query: getCars');
		return await this.carService.getCars(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Car)
	public async likeTargetCar(
		@Args('carId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Car> {
		console.log('Mutation: likeTargetCar');
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.carService.likeTargetCar(memberId, likeRefId);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Cars)
	public async getFavoriteCars(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Cars> {
		console.log('Query: getFavoriteCars');
		return await this.carService.getFavorites(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Cars)
	public async getVisitedCars(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Cars> {
		console.log('Query: getVisitedCars');
		return await this.carService.getVisited(memberId, input);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Car)
	public async updateCarByAdmin(@Args('input') input: CarUpdate): Promise<Car> {
		console.log('Mutation: updateCarByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.carService.updateCarByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Car)
	public async removeCarByAdmin(@Args('carId') input: string): Promise<Car> {
		console.log('Mutation: removeCarByAdmin');
		const carId = shapeIntoMongoObjectId(input);
		return await this.carService.removeCarByAdmin(carId);
	}
}
