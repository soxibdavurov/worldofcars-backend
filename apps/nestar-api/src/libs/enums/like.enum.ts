import { registerEnumType } from '@nestjs/graphql';

export enum LikeGroup {
	MEMBER = 'MEMBER',
	PROPERTY = 'PROPERTY',
	ARTICLE = 'ARTICLE',
	CAR = 'CAR',
}
registerEnumType(LikeGroup, {
	name: 'LikeGroup',
});
