import type { Author } from '../types';

export const authors: Author[] = [
  {
    _id: 'autor-mariafer-ruiz',
    nombre: 'María Fernanda Ruiz',
    slug: 'maria-fernanda-ruiz',
    cargo: 'Editora jefa de Política',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format&fit=crop',
    bio: 'Cubre el Congreso y la Casa Rosada desde hace quince años. Antes pasó por La Nación y Página/12. Magíster en Periodismo por la Universidad de San Andrés.',
    redesSociales: {
      twitter: 'mfruiz_ar',
      instagram: 'mariafer.periodismo',
      linkedin: 'maria-fernanda-ruiz',
    },
  },
  {
    _id: 'autor-diego-sandoval',
    nombre: 'Diego Sandoval',
    slug: 'diego-sandoval',
    cargo: 'Columnista de Economía',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&auto=format&fit=crop',
    bio: 'Economista (UBA) y máster en finanzas (Di Tella). Veinte años cubriendo política monetaria y mercados. Antes en Ámbito Financiero.',
    redesSociales: {
      twitter: 'dsandoval_eco',
      linkedin: 'diego-sandoval-economia',
    },
  },
  {
    _id: 'autor-lucia-pellegrini',
    nombre: 'Lucía Pellegrini',
    slug: 'lucia-pellegrini',
    cargo: 'Cronista de Sociedad',
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&auto=format&fit=crop',
    bio: 'Reporta desde Rosario sobre violencia, narcotráfico y políticas de género. Autora de "El nudo" (2023). Premio ADEPA en 2024.',
    redesSociales: {
      twitter: 'lupellegrini',
      instagram: 'lucia.pellegrini',
    },
  },
  {
    _id: 'autor-alejandro-bermudez',
    nombre: 'Alejandro Bermúdez',
    slug: 'alejandro-bermudez',
    cargo: 'Corresponsal en Provincias y Agro',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&auto=format&fit=crop',
    bio: 'Desde Mendoza cubre Cuyo, NOA y Patagonia. Pasó por Los Andes y Clarín Rural. Especialista en energía, minería y la economía del interior.',
    redesSociales: {
      twitter: 'abermudez_ar',
      linkedin: 'alejandro-bermudez',
    },
  },
  {
    _id: 'autor-tomas-aguirre',
    nombre: 'Tomás Aguirre',
    slug: 'tomas-aguirre',
    cargo: 'Cronista de Tribunales y Justicia',
    foto: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80&auto=format&fit=crop',
    bio: 'Cubre la Corte Suprema, Comodoro Py y los principales tribunales del país. Pasó por La Nación y Perfil. Coautor de "El laberinto judicial" (2022).',
    redesSociales: {
      twitter: 'taguirre_ar',
      linkedin: 'tomas-aguirre',
    },
  },
  {
    _id: 'autor-sofia-andrade',
    nombre: 'Sofía Andrade',
    slug: 'sofia-andrade',
    cargo: 'Cronista de Espectáculos y Cultura Pop',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80&auto=format&fit=crop',
    bio: 'Cubre música, streaming y televisión desde hace doce años. Pasó por Rolling Stone Argentina e Indie Hoy. Coautora del libro "Trap argentino: una década" (2024).',
    redesSociales: {
      twitter: 'sofiandrade_ok',
      instagram: 'sofi.andrade',
    },
  },
];

export function getAuthorBySlug(slug: string): Author | undefined {
  return authors.find((a) => a.slug === slug);
}