import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: Logger = new Logger();
  private readonly isDev = process.env.NODE_ENV !== "production";

  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const recordTime = Date.now();
    const requestType = context.getType<GqlContextType>();

    if (requestType === "http") {
      // Develop if needed!
    } else if (requestType === "graphql") {
      const gqlContext = GqlExecutionContext.create(context);

      if (this.isDev) {
        this.logger.log(
          `${this.stringify(gqlContext.getContext().req.body)}`,
          "REQUEST",
        );
      }

      return next.handle().pipe(
        tap((response) => {
          if (this.isDev) {
            const responseTime = Date.now() - recordTime;
            this.logger.log(
              `${this.stringify(response)} - ${responseTime}ms \n\n`,
              "RESPONSE",
            );
          }
        }),
        catchError((error) => {
          const responseTime = Date.now() - recordTime;
          this.logger.error(
            `${this.stringify(error?.message ?? error)} - ${responseTime}ms`,
            error?.stack,
            "GRAPHQL_ERROR",
          );
          return throwError(() => error);
        }),
      );
    }

    return next.handle();
  }

  private stringify(context: ExecutionContext): string {
    return JSON.stringify(context).slice(0, 75);
  }
}
