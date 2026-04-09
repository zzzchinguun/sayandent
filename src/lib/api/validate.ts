import { z } from 'zod';
import { apiBadRequest } from './response';

export async function parseBody<T extends z.ZodSchema>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { error: Response }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return { error: apiBadRequest('Validation failed', fieldErrors) };
    }
    return { data: result.data };
  } catch {
    return { error: apiBadRequest('Invalid JSON body') };
  }
}
