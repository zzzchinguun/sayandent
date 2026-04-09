import { createTranslatableCrud } from '@/lib/api/translatable-crud';

const crud = createTranslatableCrud({
  table: 'services',
  translationTable: 'service_translations',
  foreignKey: 'service_id',
  extraColumns: ['slug'],
  translationColumns: ['title', 'description'],
});

export const GET = crud.GET_ONE;
export const PATCH = crud.PATCH;
export const DELETE = crud.DELETE_ONE;
