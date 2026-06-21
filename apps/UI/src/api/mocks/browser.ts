import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';

export const worker = setupWorker(...authHandlers);

export async function startMockWorker(): Promise<void> {
  await worker.start({
    onUnhandledRequest: 'bypass',
  });
}