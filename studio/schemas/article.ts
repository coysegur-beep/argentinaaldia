import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'article',
  title: 'Nota',
  type: 'document',
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título',
      type: 'string',
      validation: (r) => r.required().max(200),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'titulo', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'kicker',
      title: 'Kicker (antetítulo)',
      type: 'string',
      description: 'Línea breve sobre el título. Opcional.',
    }),
    defineField({
      name: 'copete',
      title: 'Copete (dek)',
      type: 'text',
      rows: 3,
      validation: (r) =>
        r
          .required()
          .max(300)
          .warning('Más de 300 caracteres: el OG description y la meta description se truncan.'),
    }),
    defineField({
      name: 'contenido',
      title: 'Contenido',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            { name: 'alt', title: 'Alt text', type: 'string', validation: (r) => r.required() },
            { name: 'caption', title: 'Pie de foto', type: 'string' },
          ],
        },
        {
          type: 'object',
          name: 'quote',
          title: 'Cita',
          fields: [
            { name: 'text', title: 'Texto', type: 'text', validation: (r) => r.required() },
            { name: 'cite', title: 'Atribución', type: 'string' },
          ],
          preview: { select: { title: 'text', subtitle: 'cite' } },
        },
        {
          type: 'object',
          name: 'tweet',
          title: 'Tweet embebido',
          fields: [
            { name: 'url', title: 'URL del tweet', type: 'url', validation: (r) => r.required() },
          ],
        },
      ],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'imagenPrincipal',
      title: 'Imagen principal',
      type: 'image',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: 'Alt text', type: 'string', validation: (r) => r.required() },
        { name: 'caption', title: 'Pie de foto', type: 'string' },
      ],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'autor',
      title: 'Autor',
      type: 'reference',
      to: [{ type: 'author' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'categoria',
      title: 'Categoría',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: "Usar 'opinion' para que la nota aparezca en la sección Opinión.",
    }),
    defineField({
      name: 'fechaPublicacion',
      title: 'Fecha de publicación',
      type: 'datetime',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'fechaActualizacion',
      title: 'Fecha de actualización',
      type: 'datetime',
      description: 'Si es >1h posterior a la publicación, se muestra "Actualizado: …" en la nota.',
    }),
    defineField({
      name: 'esDestacada',
      title: '¿Es destacada?',
      type: 'boolean',
      initialValue: false,
      description: 'Aparece en "Lo que importa hoy" en la home (hasta 3).',
    }),
    defineField({
      name: 'esCoverDelDia',
      title: '¿Es cover del día?',
      type: 'boolean',
      initialValue: false,
      description: 'Solo una nota debería tener esto en true por día.',
    }),
    defineField({
      name: 'tiempoLectura',
      title: 'Tiempo de lectura (min)',
      type: 'number',
      validation: (r) => r.required().min(1).max(60),
    }),
    defineField({
      name: 'ai_generated',
      title: '¿Generada con asistencia de IA?',
      type: 'boolean',
      initialValue: false,
      description:
        'Marca true cuando la nota fue redactada con Claude API. Renderea el banner de disclosure en el detalle.',
    }),
  ],
  preview: {
    select: {
      title: 'titulo',
      subtitle: 'categoria.nombre',
      media: 'imagenPrincipal',
    },
  },
});
