import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Cars, Car } from '../../libs/dto/car/car';
import {
	CarsInquiry,
	CarInput,
	DealerCarsInquiry,
} from '../../libs/dto/car/car.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';
import { CarStatus } from '../../libs/enums/car.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import { CarUpdate } from '../../libs/dto/car/car.update';
import * as moment from 'moment';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LikeService } from '../like/like.service';
import { OrdinaryInquiry } from '../../libs/dto/property/property.input';
import { carBrand } from '../../libs/dto/car/carBrand';

@Injectable()
export class CarService {
	constructor(
		@InjectModel('Car') private readonly carModel: Model<Car>,
		@InjectModel('CarBrand') private readonly carBrandModel: Model<carBrand>,
		private memberService: MemberService,
		private viewService: ViewService,
		private likeService: LikeService,
	) { }

	private readonly defaultCarBrands = [
		{ value: 'honda', label: 'Honda', categoryLogo: 'car/offer/honda.svg', categoryImage: 'car/category/1.png', sortOrder: 1 },
		{ value: 'mercedes', label: 'Mercedes', categoryLogo: 'car/offer/mercedes.svg', categoryImage: 'car/category/2.png', sortOrder: 2 },
		{ value: 'renault', label: 'Renault', categoryLogo: 'car/offer/renault.svg', categoryImage: 'car/category/3.png', sortOrder: 3 },
		{ value: 'citroen', label: 'Citroen', categoryLogo: 'car/offer/citroen.svg', categoryImage: 'car/category/4.png', sortOrder: 4 },
		{ value: 'audi', label: 'Audi', categoryLogo: 'car/offer/audi.svg', categoryImage: 'car/category/5.png', sortOrder: 5 },
		{ value: 'bmw', label: 'BMW', categoryLogo: 'car/offer/bmw.svg', categoryImage: 'car/category/1.png', sortOrder: 6 },
		{ value: 'lexus', label: 'Lexus', categoryLogo: 'car/offer/lexus.svg', categoryImage: 'car/category/2.png', sortOrder: 7 },
	];

	public async getCarBrands(): Promise<carBrand[]> {
		let list = await this.carBrandModel.find({}).sort({ sortOrder: 1 }).lean().exec();
		if (!list || list.length === 0) {
			await this.carBrandModel.insertMany(this.defaultCarBrands);
			list = await this.carBrandModel.find({}).sort({ sortOrder: 1 }).lean().exec();
		}
		return list as carBrand[];
	}

	public async createCar(input: CarInput): Promise<Car> {
		try {
			const result = await this.carModel.create(input);
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberCars',
				modifier: 1,
			});
			return result;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getCar(memberId: ObjectId, carId: ObjectId): Promise<Car> {
		const search: T = {
			_id: carId,
			carStatus: CarStatus.ACTIVE,
		};

		const targetCar: Car | null = await this.carModel.findOne(search).lean().exec();
		if (!targetCar) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: carId, viewGroup: ViewGroup.CAR };
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.carStatsEditor({ _id: carId, targetKey: 'carViews', modifier: 1 });
				targetCar.carViews++;
			}
			// meLiked
			const likeInput = { memberId: memberId, likeRefId: carId, likeGroup: LikeGroup.CAR };
			targetCar.meLiked = await this.likeService.checkLikeExistence(likeInput);
		}

		targetCar.memberData = await this.memberService.getMember(null, targetCar.memberId);
		return targetCar;
	}

	public async updateCar(memberId: ObjectId, input: CarUpdate): Promise<Car> {
		let { carStatus, soldAt, deletedAt } = input;
		const search: T = {
			_id: input._id,
			memberId: memberId,
			carStatus: CarStatus.ACTIVE,
		};

		if (carStatus === CarStatus.SOLD) soldAt = moment().toDate();
		else if (carStatus === CarStatus.DELETE) deletedAt = moment().toDate();

		const result = await this.carModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (soldAt || deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: memberId,
				targetKey: 'memberCars',
				modifier: -1,
			});
		}

		return result;
	}

	public async getCars(memberId: ObjectId, input: CarsInquiry): Promise<Cars> {
		const match: T = { carStatus: CarStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);
		console.log('match:', match);

		const result = await this.carModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId),
							lookupMember,
							{ $unwind: '$memberData' }, // [memberData] => memberData
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async likeTargetCar(memberId: ObjectId, likeRefId: ObjectId): Promise<Car> {
		const target: Car | null = await this.carModel
			.findOne({ _id: likeRefId, carStatus: CarStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.CAR,
		};
		//LIKE TOGGLE
		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.carStatsEditor({ _id: likeRefId, targetKey: 'carLikes', modifier: modifier });

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Cars> {
		return await this.likeService.getFavoriteCars(memberId, input);
	}

	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Cars> {
		return await this.viewService.getVisitedCars(memberId, input);
	}

	public async getDealerCars(memberId: ObjectId, input: DealerCarsInquiry): Promise<Cars> {
		const match: T = { carStatus: CarStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		// Add memberId filter if provided
		if (input.search?.memberId) {
			match.memberId = shapeIntoMongoObjectId(input.search.memberId);
		}

		console.log('getDealerCars match:', match);

		const result = await this.carModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId),
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	private shapeMatchQuery(match: T, input: CarsInquiry): void {
		const {
			memberId,
			locationList,
			typeList,
			brandList,
			fuelTypeList,
			pricesRange,
			yearsRange,
			mileageRange,
			periodsRange,
			text,
		} = input.search;
		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
		if (locationList && locationList.length) match.carLocation = { $in: locationList };
		if (typeList && typeList.length) match.carType = { $in: typeList };
		if (brandList && brandList.length) {
			const escaped = brandList.map((b) => String(b).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
			match.carBrand = { $regex: new RegExp(`^(${escaped})$`, 'i') };
		}
		if (fuelTypeList && fuelTypeList.length) match.carFuelType = { $in: fuelTypeList };

		if (pricesRange) match.carPrice = { $gte: pricesRange.start, $lte: pricesRange.end };
		if (yearsRange) match.carYear = { $gte: yearsRange.start, $lte: yearsRange.end };
		if (mileageRange) match.carMileage = { $gte: mileageRange.start, $lte: mileageRange.end };
		if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };

		if (text) match.carTitle = { $regex: new RegExp(text, 'i') };
	}

	public async updateCarByAdmin(input: CarUpdate): Promise<Car> {
		let { carStatus, soldAt, deletedAt } = input;
		const search: T = {
			_id: input._id,
			carStatus: CarStatus.ACTIVE,
		};

		if (carStatus === CarStatus.SOLD) soldAt = moment().toDate();
		else if (carStatus === CarStatus.DELETE) deletedAt = moment().toDate();

		const result = await this.carModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (soldAt || deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberCars',
				modifier: -1,
			});
		}

		return result;
	}

	public async removeCarByAdmin(carId: ObjectId): Promise<Car> {
		const search: T = { _id: carId, carStatus: CarStatus.DELETE };
		const result = await this.carModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async carStatsEditor(input: StatisticModifier): Promise<Car> {
		const { _id, targetKey, modifier } = input;
		return await this.carModel
			.findByIdAndUpdate(
				_id,
				{
					$inc: { [targetKey]: modifier },
				},
				{ new: true },
			)
			.exec();
	}
}
