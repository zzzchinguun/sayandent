import { createTranslatableCrud } from '@/lib/api/translatable-crud';

const crud = createTranslatableCrud({
  table: 'faqs',
  translationTable: 'faq_translations',
  foreignKey: 'faq_id',
  translationColumns: ['question', 'answer'],
});

export const GET = crud.GET_ONE;
export const PATCH = crud.PATCH;
export const DELETE = crud.DELETE_ONE;
