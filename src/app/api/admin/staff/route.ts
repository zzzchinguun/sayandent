import { createTranslatableCrud } from '@/lib/api/translatable-crud';

const crud = createTranslatableCrud({
  table: 'staff',
  translationTable: 'staff_translations',
  foreignKey: 'staff_id',
  extraColumns: ['slug', 'image_url'],
  translationColumns: ['name', 'title', 'bio'],
});

export const GET = crud.GET_LIST;
export const POST = crud.POST;
