import { defineField, defineType } from 'sanity';

const VALID_SLUGS = [
  'politica',
  'economia',
  'sociedad',
  'cultura',
  'deportes',
  'agro',
  'espectaculos',
  'mundo',
  'provincias',
];

export default defineType({
  name: 'category',
  title: 'Categoría',
  type: 'document',
  fields: [
    defineField({
      name: 'nombre',
      title: 'Nombre',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'nombre' },
      description: `Solo se permiten: ${VALID_SLUGS.join(', ')}`,
      validation: (r) =>
        r.required().custom((slug) =>
          VALID_SLUGS.includes(slug?.current ?? '')
            ? true
            : `Slug debe ser uno de: ${VALID_SLUGS.join(', ')}`,
        ),
    }),
    defineField({
      name: 'descripcion',
      title: 'Descripción',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'colorAccent',
      title: 'Color de acento (hex)',
      type: 'string',
      description: 'Hex de 6 dígitos, p.ej. #A32D2D',
      validation: (r) =>
        r.regex(/^#[0-9A-Fa-f]{6}$/, { name: 'hex color de 6 dígitos' }),
    }),
    defineField({
      name: 'orden',
      title: 'Orden en el menú',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: { select: { title: 'nombre', subtitle: 'slug.current' } },
});
