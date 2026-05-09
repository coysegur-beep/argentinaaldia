import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'author',
  title: 'Autor',
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
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'nombre', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'cargo',
      title: 'Cargo',
      type: 'string',
      description: 'Ej: "Editora jefa de Política"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'foto',
      title: 'Foto',
      type: 'image',
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'redesSociales',
      title: 'Redes sociales',
      type: 'object',
      fields: [
        { name: 'twitter', title: 'X / Twitter (@usuario)', type: 'string' },
        { name: 'instagram', title: 'Instagram (@usuario)', type: 'string' },
        { name: 'linkedin', title: 'LinkedIn (slug)', type: 'string' },
      ],
    }),
  ],
  preview: {
    select: { title: 'nombre', subtitle: 'cargo', media: 'foto' },
  },
});
