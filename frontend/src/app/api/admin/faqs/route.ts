import { createTranslatableCrud } from '@/lib/api/translatable-crud';

const crud = createTranslatableCrud({
  table: 'faqs',
  translationTable: 'faq_translations',
  foreignKey: 'faq_id',
  translationColumns: ['question', 'answer'],
});

export const GET = crud.GET_LIST;
export const POST = crud.POST;
