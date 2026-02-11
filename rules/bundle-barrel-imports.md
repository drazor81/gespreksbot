# Bundle Barrel Imports

## Rule
Avoid using barrel files (`index.ts` files that only re-export other modules) for internal application code. If they exist, do not import from them; import directly from the specific file.

## Why
- **Tree Shaking**: Barrel files can make it difficult for bundlers to eliminate unused code, increasing bundle size.
- **Circular Dependencies**: Barrel files often hide circular dependencies that cause runtime errors.
- **Performance**: Importing a barrel file often requires the runtime to load and evaluate all re-exported modules, even if you only need one.

## Bad Practice
```typescript
// Assuming components/index.ts exports Button, Card, and 50 other components
import { Button } from './components';
```

## Good Practice
```typescript
import { Button } from './components/Button';
```

## Exceptions
- Public libraries often use barrel files to define their public API. This rule applies primarily to internal application code.
