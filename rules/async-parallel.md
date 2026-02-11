# Async Parallelization

## Rule
When performing multiple asynchronous operations that do not depend on each other, execute them in parallel rather than sequentially.

## Why
Sequential execution of independent async tasks adds unnecessary latency. Parallel execution reduces the total time to the duration of the longest individual task.

## Bad Practice
```typescript
// These run one after the other
const user = await fetchUser(id);
const posts = await fetchPosts(id);
const settings = await fetchSettings(id);
```

## Good Practice
```typescript
// These run concurrently
const [user, posts, settings] = await Promise.all([
  fetchUser(id),
  fetchPosts(id),
  fetchSettings(id)
]);
```

## Exceptions
- When tasks differ significantly in priority or resource usage, and you need to throttle them (use `p-limit` or similar).
- When the result of one task is required for the next.
