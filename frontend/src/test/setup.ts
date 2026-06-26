import '@testing-library/jest-dom';
import { vi } from 'vitest';

// The component tests were written with Jest's `jest.fn()` API.
// Vitest exposes the same surface as `vi`, so alias it globally.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).jest = vi;
