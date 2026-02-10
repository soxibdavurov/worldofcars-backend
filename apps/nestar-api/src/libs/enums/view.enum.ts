import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	PROPERTY = 'PROPERTY',
	CAR = 'CAR',
}
registerEnumType(ViewGroup, {
	name: 'ViewGroup',
});
