import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class carBrand {
	@Field(() => String)
	value: string;

	@Field(() => String)
	label: string;

	@Field(() => String)
	categoryLogo: string;

	@Field(() => String, { nullable: true })
	categoryImage?: string;

	@Field(() => Number, { nullable: true })
	sortOrder?: number;
}
