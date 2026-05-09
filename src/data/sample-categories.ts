import type { Category, CategorySlug } from '../types';

export const categories: Category[] = [
  {
    _id: 'cat-politica',
    nombre: 'Política',
    slug: 'politica',
    descripcion: 'Gobierno nacional, Congreso, partidos y poder.',
    colorAccent: '#A32D2D',
    orden: 1,
  },
  {
    _id: 'cat-economia',
    nombre: 'Economía',
    slug: 'economia',
    descripcion: 'Mercados, inflación, finanzas y producción.',
    colorAccent: '#185FA5',
    orden: 2,
  },
  {
    _id: 'cat-sociedad',
    nombre: 'Sociedad',
    slug: 'sociedad',
    descripcion: 'Derechos, educación, salud y vida cotidiana.',
    colorAccent: '#3B6D11',
    orden: 3,
  },
  {
    _id: 'cat-cultura',
    nombre: 'Cultura',
    slug: 'cultura',
    descripcion: 'Libros, música, cine, artes visuales.',
    colorAccent: '#3C3489',
    orden: 4,
  },
  {
    _id: 'cat-deportes',
    nombre: 'Deportes',
    slug: 'deportes',
    descripcion: 'Fútbol, básquet, tenis y la pelota nacional.',
    colorAccent: '#0F6E56',
    orden: 5,
  },
  {
    _id: 'cat-agro',
    nombre: 'Agro',
    slug: 'agro',
    descripcion: 'Campo, ganadería, mercados rurales.',
    colorAccent: '#854F0B',
    orden: 6,
  },
  {
    _id: 'cat-espectaculos',
    nombre: 'Espectáculos',
    slug: 'espectaculos',
    descripcion: 'Televisión, streaming, farándula.',
    colorAccent: '#993556',
    orden: 7,
  },
  {
    _id: 'cat-mundo',
    nombre: 'Mundo',
    slug: 'mundo',
    descripcion: 'América latina, EE.UU., Europa, Asia.',
    colorAccent: '#444441',
    orden: 8,
  },
  {
    _id: 'cat-provincias',
    nombre: 'Provincias',
    slug: 'provincias',
    descripcion: 'Federalismo: NOA, NEA, Cuyo, Patagonia, centro.',
    colorAccent: '#6B4423',
    orden: 9,
  },
];

export function getCategoryBySlug(slug: CategorySlug): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
