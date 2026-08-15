import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BoardArticle, BoardArticleMeta, BoardArticles } from '../../libs/dto/board-article/board-article';
import { Model, ObjectId, Types } from 'mongoose';
import {
	AllBoardArticlesInquiry,
	BoardArticleInput,
	BoardArticlesInquiry,
} from '../../libs/dto/board-article/board-article.input';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';
import { Direction, Message } from '../../libs/enums/common.enum';
import { BoardArticleCategory, BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';
import { lookupAuthMemberLiked, lookupMember, lookupMemberLite, shapeIntoMongoObjectId } from '../../libs/config';
import { BoardArticleUpdate } from '../../libs/dto/board-article/board-article.update';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';

@Injectable()
export class BoardArticleService {
	constructor(
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
		private readonly memberService: MemberService,
		private readonly viewService: ViewService,
		private readonly likeService: LikeService,
	) {}

	private normalizeArticleCategory(
		value?: string | null,
		idToName?: Map<string, string>,
	): BoardArticleCategory | null {
		if (!value) return null;
		const raw = String(value);
		const upper = raw.toUpperCase();
		if (Object.values(BoardArticleCategory).includes(upper as BoardArticleCategory)) {
			return upper as BoardArticleCategory;
		}
		if (idToName && idToName.has(raw)) {
			const mapped = String(idToName.get(raw)).toUpperCase();
			if (Object.values(BoardArticleCategory).includes(mapped as BoardArticleCategory)) {
				return mapped as BoardArticleCategory;
			}
		}
		return null;
	}

	public async createBoardArticle(memberId: ObjectId, input: BoardArticleInput): Promise<BoardArticle> {
		input.memberId = memberId; // <= Nega bu try ichida emas?
		try {
			const result = await this.boardArticleModel.create(input);
			await this.memberService.memberStatsEditor({
				_id: memberId,
				targetKey: 'memberArticles',
				modifier: 1,
			});

			return result;
		} catch (err) {
			console.log('Error, Service.model:', (err as Error).message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getBoardArticle(memberId: ObjectId, articleId: ObjectId): Promise<BoardArticle> {
		const search: T = {
			_id: articleId,
			articleStatus: BoardArticleStatus.ACTIVE,
		};

		const targetBoardArticle: BoardArticle | null = await this.boardArticleModel.findOne(search).lean().exec();
		// BoardArticleni modify qilish imkoniyatiga ega bo'lish uchun leanni ishlatayapmiz
		if (!targetBoardArticle) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: articleId, viewGroup: ViewGroup.ARTICLE };
			await this.viewService.recordView(viewInput);
			const likeInput = { memberId: memberId, likeRefId: articleId, likeGroup: LikeGroup.ARTICLE };
			targetBoardArticle.meLiked = await this.likeService.checkLikeExistence(likeInput);
		}

		targetBoardArticle.memberData = await this.memberService.getMember(null, targetBoardArticle.memberId);

		// Normalize articleCategory if DB stores ObjectId or mixed casing
		if (targetBoardArticle.articleCategory) {
			const rawCategory = String(targetBoardArticle.articleCategory);
			if (/^[a-f0-9]{24}$/i.test(rawCategory)) {
				const cc = this.boardArticleModel.db.collection('communityCategories');
				const categoryDoc = await cc.findOne({ _id: new Types.ObjectId(rawCategory) });
				const idToName = new Map([[String(categoryDoc?._id), categoryDoc?.name ?? '']]);
				targetBoardArticle.articleCategory = this.normalizeArticleCategory(rawCategory, idToName) as any;
			} else {
				targetBoardArticle.articleCategory = this.normalizeArticleCategory(rawCategory) as any;
			}
		}
		if (targetBoardArticle) {
			this.normalizeArticleRecord(targetBoardArticle);
		}
		return targetBoardArticle;
	}

	/** Sahifa ochilganda bir marta chaqiriladi — articleViews 1 ga oshadi (like/refetch da oshmaydi) */
	public async recordArticleView(articleId: ObjectId): Promise<boolean> {
		const target = await this.boardArticleModel.findById(articleId).select('_id').lean().exec();
		if (!target) return false;
		await this.boardArticleStatsEditor({ _id: articleId, targetKey: 'articleViews', modifier: 1 });
		return true;
	}

	public async updateBoardArticle(memberId: ObjectId, input: BoardArticleUpdate): Promise<BoardArticle> {
		const { _id, articleStatus } = input; // distraction inputni ichidagi alohida qilib olinyapti

		const result = await this.boardArticleModel
			.findOneAndUpdate({ _id: _id, memberId: memberId, articleStatus: BoardArticleStatus.ACTIVE }, input, {
				new: true,
			})
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (articleStatus === BoardArticleStatus.DELETE) {
			await this.memberService.memberStatsEditor({
				_id: memberId,
				targetKey: 'memberArticles',
				modifier: -1,
			});
		}

		return result;
	}

	private buildArticleExcerpt(content?: string | null): string {
		if (!content) return '';
		const plain = String(content).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
		return plain.length > 120 ? `${plain.slice(0, 120)}…` : plain;
	}

	private normalizeArticleRecord(article: BoardArticle): void {
		article.articleViews = article.articleViews ?? 0;
		article.articleLikes = article.articleLikes ?? 0;
		article.articleComments = article.articleComments ?? 0;
		article.articleContent = article.articleContent ?? '';
		article.articleImage = article.articleImage ?? [];
	}

	private shapeLiteArticles(list: BoardArticle[]): void {
		for (const item of list) {
			this.normalizeArticleRecord(item);
			item.articleExcerpt = this.buildArticleExcerpt(item.articleContent);
			item.articleContent = '';
		}
	}

	private finalizeArticleList(list: BoardArticle[]): void {
		for (const item of list) {
			this.normalizeArticleRecord(item);
		}
	}

	private async normalizeListCategories(list: BoardArticle[]): Promise<void> {
		const ids = list
			.map((item: any) => item?.articleCategory)
			.filter((val: any) => typeof val === 'string' && /^[a-f0-9]{24}$/i.test(val));
		if (ids.length) {
			const cc = this.boardArticleModel.db.collection('communityCategories');
			const categoryDocs = await cc
				.find({ _id: { $in: ids.map((id: string) => new Types.ObjectId(id)) } })
				.toArray();
			const idToName = new Map(categoryDocs.map((doc: any) => [String(doc._id), doc.name]));
			for (const item of list) {
				item.articleCategory = this.normalizeArticleCategory(item?.articleCategory, idToName) as any;
			}
		} else {
			for (const item of list) {
				item.articleCategory = this.normalizeArticleCategory(item?.articleCategory) as any;
			}
		}
	}

	public async getBoardArticleMeta(): Promise<BoardArticleMeta> {
		const result = await this.boardArticleModel
			.aggregate([
				{ $match: { articleStatus: BoardArticleStatus.ACTIVE } },
				{
					$facet: {
						total: [{ $count: 'count' }],
						byCategory: [
							{ $group: { _id: '$articleCategory', total: { $sum: 1 } } },
							{ $project: { _id: 0, articleCategory: '$_id', total: 1 } },
						],
					},
				},
			])
			.exec();

		const facet = result?.[0] ?? { total: [], byCategory: [] };
		const rawByCategory = facet.byCategory ?? [];
		const ids = rawByCategory
			.map((item: any) => item?.articleCategory)
			.filter((val: any) => typeof val === 'string' && /^[a-f0-9]{24}$/i.test(val));

		let idToName = new Map<string, string>();
		if (ids.length) {
			const cc = this.boardArticleModel.db.collection('communityCategories');
			const categoryDocs = await cc
				.find({ _id: { $in: ids.map((id: string) => new Types.ObjectId(id)) } })
				.toArray();
			idToName = new Map(categoryDocs.map((doc: any) => [String(doc._id), doc.name]));
		}

		const byCategory = rawByCategory.map((item: any) => ({
			articleCategory: this.normalizeArticleCategory(item?.articleCategory, idToName),
			total: item?.total ?? 0,
		}));

		return {
			total: facet.total?.[0]?.count ?? 0,
			byCategory,
		};
	}

	public async getBoardArticles(memberId: ObjectId, input: BoardArticlesInquiry): Promise<BoardArticles> {
		const { articleCategory, text } = input.search;
		const match: T = { articleStatus: BoardArticleStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		const lite = input.lite === true;
		const memberLookup = lite ? lookupMemberLite : lookupMember;

		if (articleCategory) match.articleCategory = articleCategory;
		if (text) match.articleTitle = { $regex: new RegExp(text, 'i') };
		if (input.search?.memberId) {
			match.memberId = shapeIntoMongoObjectId(input.search.memberId);
		}

		const listPipeline: T[] = [
			{ $skip: (input.page - 1) * input.limit },
			{ $limit: input.limit },
			lookupAuthMemberLiked(memberId),
			memberLookup,
			lite
				? { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } }
				: { $unwind: '$memberData' },
		];

		const result = await this.boardArticleModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: listPipeline as any[],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) return { list: [], metaCounter: [{ total: 0 }] };

		const list = result[0].list ?? [];
		if (lite) this.shapeLiteArticles(list);
		else this.finalizeArticleList(list);
		await this.normalizeListCategories(list);

		return result[0];
	}

	public async getAllBoardArticlesByAdmin(input: AllBoardArticlesInquiry): Promise<BoardArticles> {
		const { articleStatus, articleCategory } = input.search;

		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (articleStatus) match.articleStatus = articleStatus;
		if (articleCategory) match.articleCategory = articleCategory;

		const result = await this.boardArticleModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) return { list: [], metaCounter: [{ total: 0 }] };

		const list = result[0].list ?? [];
		const ids = list
			.map((item: any) => item?.articleCategory)
			.filter((val: any) => typeof val === 'string' && /^[a-f0-9]{24}$/i.test(val));
		if (ids.length) {
			const cc = this.boardArticleModel.db.collection('communityCategories');
			const categoryDocs = await cc
				.find({ _id: { $in: ids.map((id: string) => new Types.ObjectId(id)) } })
				.toArray();
			const idToName = new Map(categoryDocs.map((doc: any) => [String(doc._id), doc.name]));
			for (const item of list) {
				item.articleCategory = this.normalizeArticleCategory(item?.articleCategory, idToName) as any;
			}
		} else {
			for (const item of list) {
				item.articleCategory = this.normalizeArticleCategory(item?.articleCategory) as any;
			}
		}

		return result[0];
	}

	public async updateBoardArticleByAdmin(input: BoardArticleUpdate): Promise<BoardArticle> {
		const { _id, articleStatus } = input;

		const result = await this.boardArticleModel
			.findOneAndUpdate({ _id: _id, articleStatus: BoardArticleStatus.ACTIVE }, input, {
				new: true,
			})
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (articleStatus === BoardArticleStatus.DELETE) {
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberArticles',
				modifier: -1,
			});
		}

		return result;
	}

	public async removeBoardArticleByAdmin(articleId: ObjectId): Promise<BoardArticle> {
		const search: T = { _id: articleId, articleStatus: BoardArticleStatus.DELETE };
		const result = await this.boardArticleModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async likeTargetBoardArticle(memberId: ObjectId, likeRefId: ObjectId): Promise<BoardArticle> {
		const target: BoardArticle | null = await this.boardArticleModel
			.findOne({ _id: likeRefId, articleStatus: BoardArticleStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.ARTICLE,
		};
		//LIKE TOGGLE
		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.boardArticleStatsEditor({
			_id: likeRefId,
			targetKey: 'articleLikes',
			modifier: modifier,
		});

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async boardArticleStatsEditor(input: StatisticModifier): Promise<BoardArticle | null> {
		const { _id, targetKey, modifier } = input;
		return await this.boardArticleModel
			.findByIdAndUpdate(
				_id,
				{ $inc: { [targetKey]: modifier } },
				{
					new: true,
				},
			)
			.exec();
	}
}
