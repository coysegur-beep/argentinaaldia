export type CategorySlug =
  | 'politica'
  | 'economia'
  | 'sociedad'
  | 'cultura'
  | 'deportes'
  | 'agro'
  | 'espectaculos'
  | 'mundo'
  | 'provincias';

export interface Category {
  _id?: string;
  nombre: string;
  slug: CategorySlug;
  descripcion?: string;
  colorAccent: string;
  orden: number;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

export interface Author {
  _id?: string;
  nombre: string;
  slug: string;
  bio?: string | ContentBlock[];
  foto: string;
  cargo: string;
  redesSociales?: SocialLinks;
}

export type ContentBlock =
  | {
      _type: 'block';
      style?: 'normal' | 'h2' | 'h3' | 'blockquote';
      children: { text: string; marks?: string[] }[];
    }
  | {
      _type: 'image';
      src: string;
      alt: string;
      caption?: string;
      // Mismos opcionales que ArticleImage. Provistos por la projection de Sanity
      // (asset->metadata.dimensions, lqip, hotspot). En samples van vacíos hasta
      // que el helper de sample-articles los rellene.
      width?: number | null;
      height?: number | null;
      lqip?: string | null;
      hotspotX?: number | null;
      hotspotY?: number | null;
    }
  | { _type: 'quote'; text: string; cite?: string }
  | { _type: 'tweet'; url: string };

export interface ArticleImage {
  src: string;
  alt: string;
  caption?: string;
  // Metadata opcional que viene de Sanity (asset->metadata.dimensions, lqip)
  // y del hotspot del editor. Ausente o null en samples y assets externos
  // (Unsplash); presente cuando la imagen sale del CDN de Sanity. Tipado
  // como `T | null` porque GROQ devuelve `null` para paths ausentes, no
  // `undefined`.
  width?: number | null;
  height?: number | null;
  lqip?: string | null;
  hotspotX?: number | null;
  hotspotY?: number | null;
}

export interface Article {
  _id?: string;
  titulo: string;
  slug: string;
  kicker?: string;
  copete: string;
  contenido: ContentBlock[];
  imagenPrincipal: ArticleImage;
  autor: Author;
  categoria: Category;
  tags: string[];
  fechaPublicacion: string;
  fechaActualizacion?: string;
  esDestacada: boolean;
  esCoverDelDia: boolean;
  tiempoLectura: number;
  /** True si la nota fue redactada con asistencia de IA (Claude API).
   *  El detail page renderea <AiDisclosure /> cuando es true. */
  ai_generated?: boolean;
}

