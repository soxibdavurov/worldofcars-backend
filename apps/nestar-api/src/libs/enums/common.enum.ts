import { registerEnumType } from '@nestjs/graphql';

export enum Message {
	BAD_REQUEST = 'Something is bad!',
	SOMETHING_WENT_WRONG = 'Something went wrong!',
	NO_DATA_FOUND = 'No data found',
	CREATE_FAILED = 'Create is failed!',
	UPDATE_FAILED = 'Update is failed',
	REMOVE_FAILED = 'Remove failed',
	UPLOAD_FAILED = 'Upload failed',

	USED_MEMBER_NICK_OR_PHONE = 'Already used member nick or phone',
	USED_NICK_PHONE = 'You are inserting already used nick or phone',
	NO_MEMBER_NICK = 'No member found with that member nick!',
	BLOCKED_USER = 'You have been blocked, contact admin!',
	WRONG_PASSWORD = 'Wrong password, please try again.',
	TOKEN_NOT_EXIST = 'Bearer Token is not provided!',
	ONLY_SPECIFIC_ROLES_ALLOWED = 'Allowed only for members with SPECIFIC ROLES!',
	NOT_AUTHENTICATED = 'You are not authenticated, please login first.',
	TOKEN_CREATION_FAILED = 'Token create failed!',
	NOT_ALLOWED_REQUEST = 'Not allowed request',
	ONLY_SPECIFIC_ROLES_ALLOWD = 'Allowed only for members with specific roles!',
	PROVIDE_ALLOWED_FORMAT = 'Please provide, jpg, jpeg or png, webp images!',
	SELF_SUBSCRIPTION_DENIED = 'Self subscription is denied!',
}

export enum Direction {
	ASC = 1,
	DESC = -1,
}
registerEnumType(Direction, {
	name: 'Direction',
});
