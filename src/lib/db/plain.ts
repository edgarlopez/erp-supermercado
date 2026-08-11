// Server Components/Actions can't pass class instances (TypeORM entities) to
// Client Components -- React's RSC serialization only accepts plain objects.
export function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
