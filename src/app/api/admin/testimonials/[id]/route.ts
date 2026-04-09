import { createTranslatableCrud } from '@/lib/api/translatable-crud';

const crud = createTranslatableCrud({
  table: 'testimonials',
  translationTable: 'testimonial_translations',
  foreignKey: 'testimonial_id',
  translationColumns: ['name', 'role', 'content', 'avatar'],
});

export const GET = crud.GET_ONE;
export const PATCH = crud.PATCH;
export const DELETE = crud.DELETE_ONE;
