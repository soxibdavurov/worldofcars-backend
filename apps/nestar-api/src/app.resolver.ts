import {Query, Resolver} from '@nestjs/graphql';

@Resolver() 
export class AppResolver {
    @Query(() => String)
    public sayHello(): string{
        return "GraphQL API Server. Assalomu alaykum azizlar, sizlar bilan Bekzod Rizo!";
    }
}