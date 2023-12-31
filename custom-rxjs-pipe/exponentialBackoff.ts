import { defer, iif, Observable, throwError, timer } from 'rxjs';
import { concatMap, retryWhen } from 'rxjs/operators';

export interface RetryBackoffConfig {
  // Initial interval. It will eventually go as high as maxInterval.
  initialInterval: number;
  // Maximum number of retry attempts.
  maxRetries?: number;
  // Maximum delay between retries.
  maxInterval?: number;
  backoffDelay?: (iteration: number, initialInterval: number) => number;
}

function getDelay(backoffDelay: number, maxInterval: number) {
  return Math.min(backoffDelay, maxInterval);
}

function exponentialBackoffDelay(iteration: number, initialInterval: number) {
  return Math.pow(2, iteration) * initialInterval;
}

/**
 * Returns an Observable that mirrors the source Observable with the exception
 * of an error. If the source Observable calls error, rather than propagating
 * the error call this method will resubscribe to the source Observable with
 * exponentially increasing interval and up to a maximum of count
 * resubscriptions (if provided). Retrying can be cancelled at any point if
 * shouldRetry returns false.
 */
export function exponentialBackoff(config: number | RetryBackoffConfig): <T>(source: Observable<T>) => Observable<T> {
  const { initialInterval, maxRetries = Infinity, maxInterval = Infinity, backoffDelay = exponentialBackoffDelay } =
    typeof config === 'number' ? { initialInterval: config } : config;
  return <T>(source: Observable<T>) =>
    defer(() => {
      let index = 0;
      return source.pipe(
        retryWhen<T>((errors) =>
          errors.pipe(
            concatMap((error) => {
              const attempt = index++;
              return iif(
                () => attempt < maxRetries,
                timer(getDelay(backoffDelay(attempt, initialInterval), maxInterval)),
                throwError(error)
              );
            })
          )
        )
      );
    });
}
