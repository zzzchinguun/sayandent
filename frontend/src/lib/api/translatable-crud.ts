import { query, queryOne, execute, pool } from '@/lib/db/client';
import { withAuth } from '@/lib/auth/middleware';
import { parsePagination } from './pagination';
import { apiResponse, apiResponsePaginated, apiNotFound, apiInternalError } from './response';

interface TranslatableCrudConfig {
  table: string;
  translationTable: string;
  foreignKey: string;
  extraColumns?: string[];         // columns on parent table beyond slug, sort_order, is_active
  translationColumns: string[];    // columns on translation table beyond locale
}

export function createTranslatableCrud(config: TranslatableCrudConfig) {
  const { table, translationTable, foreignKey, extraColumns = [], translationColumns } = config;

  const GET_LIST = withAuth(async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const { page, pageSize, skip } = parsePagination(searchParams);

      const [rows, countResult] = await Promise.all([
        query(
          `SELECT p.*,
            COALESCE(json_agg(json_build_object(
              'locale', t.locale,
              ${translationColumns.map(c => `'${c}', t.${c}`).join(', ')}
            )) FILTER (WHERE t.id IS NOT NULL), '[]') as translations
           FROM ${table} p
           LEFT JOIN ${translationTable} t ON t.${foreignKey} = p.id
           WHERE p.deleted_at IS NULL
           GROUP BY p.id
           ORDER BY p.sort_order ASC
           LIMIT $1 OFFSET $2`,
          [pageSize, skip]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM ${table} WHERE deleted_at IS NULL`
        ),
      ]);

      const total = parseInt(countResult[0]?.count ?? '0', 10);
      return apiResponsePaginated(rows, { page, pageSize, total });
    } catch (err) {
      return apiInternalError(err);
    }
  });

  const POST = withAuth(async (req) => {
    const client = await pool.connect();
    try {
      const body = await req.json();
      await client.query('BEGIN');

      // Build parent insert
      const parentCols = ['sort_order', 'is_active', ...extraColumns];
      const parentVals = [body.sortOrder ?? 0, body.isActive ?? true];
      for (const col of extraColumns) {
        const camelKey = col.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
        parentVals.push(body[camelKey] ?? null);
      }
      const parentPlaceholders = parentVals.map((_, i) => `$${i + 1}`).join(', ');

      const parentResult = await client.query(
        `INSERT INTO ${table} (${parentCols.join(', ')}) VALUES (${parentPlaceholders}) RETURNING *`,
        parentVals
      );
      const parent = parentResult.rows[0];

      // Insert translations
      if (body.translations && Array.isArray(body.translations)) {
        for (const trans of body.translations) {
          const transCols = [foreignKey, 'locale', ...translationColumns];
          const transVals = [parent.id, trans.locale, ...translationColumns.map(c => trans[c])];
          const transPlaceholders = transVals.map((_, i) => `$${i + 1}`).join(', ');

          await client.query(
            `INSERT INTO ${translationTable} (${transCols.join(', ')}) VALUES (${transPlaceholders})`,
            transVals
          );
        }
      }

      await client.query('COMMIT');

      // Fetch with translations
      const row = await queryOne(
        `SELECT p.*,
          COALESCE(json_agg(json_build_object(
            'locale', t.locale,
            ${translationColumns.map(c => `'${c}', t.${c}`).join(', ')}
          )) FILTER (WHERE t.id IS NOT NULL), '[]') as translations
         FROM ${table} p
         LEFT JOIN ${translationTable} t ON t.${foreignKey} = p.id
         WHERE p.id = $1
         GROUP BY p.id`,
        [parent.id]
      );

      return apiResponse(row, 201);
    } catch (err) {
      await client.query('ROLLBACK');
      return apiInternalError(err);
    } finally {
      client.release();
    }
  });

  const GET_ONE = withAuth(async (_req, ctx) => {
    try {
      const { id } = await ctx.params;
      const row = await queryOne(
        `SELECT p.*,
          COALESCE(json_agg(json_build_object(
            'locale', t.locale,
            ${translationColumns.map(c => `'${c}', t.${c}`).join(', ')}
          )) FILTER (WHERE t.id IS NOT NULL), '[]') as translations
         FROM ${table} p
         LEFT JOIN ${translationTable} t ON t.${foreignKey} = p.id
         WHERE p.id = $1 AND p.deleted_at IS NULL
         GROUP BY p.id`,
        [id]
      );
      if (!row) return apiNotFound();
      return apiResponse(row);
    } catch (err) {
      return apiInternalError(err);
    }
  });

  const PATCH = withAuth(async (req, ctx) => {
    const client = await pool.connect();
    try {
      const { id } = await ctx.params;
      const body = await req.json();
      await client.query('BEGIN');

      // Update parent fields
      const fields: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (body.sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(body.sortOrder); }
      if (body.isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(body.isActive); }
      for (const col of extraColumns) {
        const camelKey = col.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
        if (body[camelKey] !== undefined) { fields.push(`${col} = $${idx++}`); values.push(body[camelKey]); }
      }

      if (fields.length > 0) {
        values.push(id);
        const result = await client.query(
          `UPDATE ${table} SET ${fields.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING id`,
          values
        );
        if (result.rowCount === 0) {
          await client.query('ROLLBACK');
          return apiNotFound();
        }
      }

      // Upsert translations
      if (body.translations && Array.isArray(body.translations)) {
        for (const trans of body.translations) {
          const setClauses = translationColumns.map(c => `${c} = EXCLUDED.${c}`).join(', ');
          const transCols = [foreignKey, 'locale', ...translationColumns];
          const transVals = [id, trans.locale, ...translationColumns.map(c => trans[c])];
          const transPlaceholders = transVals.map((_, i) => `$${i + 1}`).join(', ');

          await client.query(
            `INSERT INTO ${translationTable} (${transCols.join(', ')}) VALUES (${transPlaceholders})
             ON CONFLICT (${foreignKey}, locale) DO UPDATE SET ${setClauses}`,
            transVals
          );
        }
      }

      await client.query('COMMIT');

      const row = await queryOne(
        `SELECT p.*,
          COALESCE(json_agg(json_build_object(
            'locale', t.locale,
            ${translationColumns.map(c => `'${c}', t.${c}`).join(', ')}
          )) FILTER (WHERE t.id IS NOT NULL), '[]') as translations
         FROM ${table} p
         LEFT JOIN ${translationTable} t ON t.${foreignKey} = p.id
         WHERE p.id = $1
         GROUP BY p.id`,
        [id]
      );

      return apiResponse(row);
    } catch (err) {
      await client.query('ROLLBACK');
      return apiInternalError(err);
    } finally {
      client.release();
    }
  });

  const DELETE_ONE = withAuth(async (_req, ctx) => {
    try {
      const { id } = await ctx.params;
      const affected = await execute(
        `UPDATE ${table} SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );
      if (affected === 0) return apiNotFound();
      return apiResponse({ message: 'Deleted' });
    } catch (err) {
      return apiInternalError(err);
    }
  });

  return { GET_LIST, POST, GET_ONE, PATCH, DELETE_ONE };
}
