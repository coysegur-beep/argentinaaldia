import type { Article, CategorySlug } from '../types';
import { getCategoryBySlug } from './sample-categories';
import { getAuthorBySlug } from './sample-authors';

function cat(slug: CategorySlug) {
  const c = getCategoryBySlug(slug);
  if (!c) throw new Error(`Categoría no encontrada en samples: ${slug}`);
  return c;
}

function author(slug: string) {
  const a = getAuthorBySlug(slug);
  if (!a) throw new Error(`Autor no encontrado en samples: ${slug}`);
  return a;
}

function p(text: string) {
  return { _type: 'block' as const, style: 'normal' as const, children: [{ text }] };
}

// LQIP genérico (SVG 4:3 gris) que usamos como blur placeholder en samples.
// El browser lo escala al aspect-ratio del contenedor donde se monta, así
// que sirve para cualquier crop. Cuando una nota viene de Sanity real, el
// lqip viene del CDN (asset->metadata.lqip).
const SAMPLE_IMG_LQIP =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0IDMiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjMiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=';

// Dimensiones por defecto para samples. 16:9 coincide con aspect-video, que
// es el aspect-ratio que la mayoría de los componentes aplican. Sirven para
// que el browser reserve la caja antes de cargar el bitmap (CLS = 0).
const SAMPLE_IMG_W = 1600;
const SAMPLE_IMG_H = 900;

const _rawArticles: Article[] = [
  {
    _id: 'art-paritarias-uta-cgt',
    titulo: 'UTA y la CGT cerraron una recomposición salarial del 28% en tres tramos',
    slug: 'uta-cgt-recomposicion-salarial-28-por-ciento',
    kicker: 'Paritarias nacionales',
    copete:
      'El acuerdo entre el sindicato de colectiveros y la cúpula sindical fija aumentos hasta agosto y reabre la discusión por el bono de fin de año. El Gobierno acompañó la mesa pero no firmó.',
    contenido: [
      p('Tras una semana de negociaciones en la sede de la Secretaría de Trabajo, la Unión Tranviarios Automotor (UTA) y la conducción de la CGT firmaron una recomposición salarial del 28% que se aplicará en tres tramos consecutivos: 12% en mayo, 10% en junio y 6% en agosto.'),
      {
        _type: 'quote',
        text: 'No es lo que pedíamos pero recupera capacidad de compra frente a la inflación de los últimos cuatro meses.',
        cite: 'Roberto Fernández, secretario general de la UTA',
      },
      p('El Gobierno nacional, a través del secretario de Trabajo, acompañó la mesa pero optó por no firmar el acuerdo. La discusión por el bono de fin de año queda abierta para una nueva ronda en septiembre.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1600&q=80&auto=format&fit=crop',
      alt: 'Apretón de manos en una mesa de negociación sindical',
      caption: 'La firma se dio en la sede de la Secretaría de Trabajo. Foto: Archivo.',
    },
    autor: author('maria-fernanda-ruiz'),
    categoria: cat('politica'),
    tags: ['paritarias', 'cgt', 'uta', 'sindicatos', 'investigacion'],
    fechaPublicacion: '2026-05-06T08:30:00-03:00',
    fechaActualizacion: '2026-05-06T10:15:00-03:00',
    esDestacada: true,
    esCoverDelDia: true,
    tiempoLectura: 5,
  },
  {
    _id: 'art-ipc-abril-2026',
    titulo: 'El IPC de abril fue del 1,9%, el menor desde fines de 2017',
    slug: 'ipc-abril-2026-1-9-por-ciento',
    kicker: 'Inflación',
    copete:
      'El Indec confirmó la cifra: cuarto mes consecutivo a la baja. Alimentos y bebidas marcaron 1,4%. Los analistas debaten si la desaceleración tiene piso.',
    contenido: [
      p('El Instituto Nacional de Estadística y Censos (Indec) informó este lunes que el Índice de Precios al Consumidor (IPC) de abril marcó un 1,9% mensual, el registro más bajo desde diciembre de 2017.'),
      p('La división Alimentos y bebidas no alcohólicas, que tiene la mayor incidencia en el cálculo, avanzó un 1,4% — por debajo del nivel general por tercer mes consecutivo.'),
      p('La interanual quedó en 38,7%, marcando una desaceleración significativa respecto del 211% con el que cerró 2023.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1600&q=80&auto=format&fit=crop',
      alt: 'Gráfico financiero ascendente sobre billetes',
      caption: 'Cuarto mes consecutivo a la baja, según Indec.',
    },
    autor: author('diego-sandoval'),
    categoria: cat('economia'),
    tags: ['inflacion', 'indec', 'ipc', 'investigacion'],
    fechaPublicacion: '2026-05-06T11:15:00-03:00',
    esDestacada: true,
    esCoverDelDia: false,
    tiempoLectura: 4,
  },
  {
    _id: 'art-femicidio-rosario',
    titulo: 'Otro femicidio en Rosario: la víctima fue asesinada en su casa por su ex pareja',
    slug: 'femicidio-rosario-mayo-2026',
    kicker: 'Violencia de género',
    copete:
      'Es la cuarta víctima en lo que va del año en Santa Fe. La fiscalía pidió la captura del agresor, que está prófugo. Marcha esta tarde frente al Concejo Municipal.',
    contenido: [
      p('El crimen ocurrió durante la madrugada del lunes en una vivienda del barrio Tablada, en el sur de Rosario. La víctima, de 34 años, había hecho dos denuncias por violencia en los últimos seis meses.'),
      p('La fiscalía de Género provincial pidió la captura nacional e internacional del agresor, que está prófugo desde hace 14 horas. Las organizaciones convocan a una marcha esta tarde a las 18 frente al Concejo Municipal.'),
      {
        _type: 'quote',
        text: 'El sistema sabía que esta mujer estaba en riesgo y no actuó. Cuatro femicidios en cuatro meses no son tragedia: son una falla estructural.',
        cite: 'Mariana Acosta, Multisectorial de Mujeres de Rosario',
      },
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=1200&q=80&auto=format',
      alt: 'Balanza dorada de la justicia sobre el escritorio de un tribunal',
      caption: 'Foto: Unsplash',
    },
    autor: author('lucia-pellegrini'),
    categoria: cat('sociedad'),
    tags: ['femicidio', 'genero', 'rosario', 'santa-fe'],
    fechaPublicacion: '2026-05-06T07:00:00-03:00',
    esDestacada: true,
    esCoverDelDia: false,
    tiempoLectura: 6,
  },
  {
    _id: 'art-vaca-muerta-record',
    titulo: 'Vaca Muerta marcó un récord histórico: superó los 500.000 barriles diarios',
    slug: 'vaca-muerta-record-500000-barriles',
    kicker: 'Energía',
    copete:
      'La cuenca neuquina alcanzó la cifra más alta desde su puesta en producción comercial. YPF y Vista lideran la explotación. Crece la discusión por la infraestructura de transporte.',
    contenido: [
      p('La producción de petróleo no convencional en Vaca Muerta superó los 500.000 barriles diarios durante abril, según los datos consolidados que publicó la Secretaría de Energía. Es la cifra más alta desde que la formación neuquina entró en producción comercial.'),
      p('YPF aporta el 48% del total, seguida por Vista Oil & Gas (18%), Pan American Energy (11%) y Pluspetrol (8%). El crecimiento interanual es del 31%.'),
      p('El cuello de botella sigue siendo el transporte: el oleoducto Oldelval opera al 95% de capacidad y la obra de ampliación a Bahía Blanca se demoró por reclamos de comunidades mapuches.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1600&q=80&auto=format&fit=crop',
      alt: 'Equipo de bombeo de petróleo en yacimiento al atardecer',
      caption: 'La cuenca neuquina alcanzó su pico productivo histórico.',
    },
    autor: author('alejandro-bermudez'),
    categoria: cat('provincias'),
    tags: ['vaca-muerta', 'energia', 'neuquen', 'patagonia', 'ypf', 'investigacion'],
    fechaPublicacion: '2026-05-05T18:45:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 5,
  },
  {
    _id: 'art-cosecha-soja',
    titulo: 'Arrancó la cosecha de soja en zona núcleo con rindes 18% mejores que el año pasado',
    slug: 'cosecha-soja-zona-nucleo-2026',
    kicker: 'Campaña 2025/26',
    copete:
      'Los primeros lotes en Pergamino y San Pedro confirman el rebote post-sequía. Estiman una cosecha total de 50 millones de toneladas. El clima de mayo será determinante.',
    contenido: [
      p('Los primeros lotes cosechados en Pergamino, San Pedro y Pehuajó confirman lo que las consultoras venían anticipando: la campaña 2025/26 traerá rindes promedio un 18% superiores al año pasado.'),
      p('La Bolsa de Cereales de Buenos Aires proyecta una cosecha total de 50 millones de toneladas, frente a las 42 millones del ciclo anterior. Si se confirma, sería la segunda mejor campaña de la última década.'),
      p('El clima de las próximas tres semanas será determinante: el ingreso de un frente de lluvias prolongadas podría complicar la trilla en zona oeste.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80&auto=format&fit=crop',
      alt: 'Cosechadora en campo de soja al atardecer',
      caption: 'Los primeros lotes confirman el rebote post-sequía.',
    },
    autor: author('alejandro-bermudez'),
    categoria: cat('agro'),
    tags: ['soja', 'cosecha', 'agro', 'pampa-humeda'],
    fechaPublicacion: '2026-05-05T12:30:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 4,
  },
  {
    _id: 'art-superclasico-1-1',
    titulo: 'River y Boca empataron 1-1 en un Monumental sin emociones',
    slug: 'superclasico-river-boca-1-1-mayo-2026',
    kicker: 'Superclásico',
    copete:
      'Borja para River en el primer tiempo, Cavani para Boca a los 70. Ambos quedan a tres puntos de la cima. Polémica por el VAR en el segundo gol.',
    contenido: [
      p('River y Boca empataron 1-1 en un Monumental con 84 mil espectadores y poca claridad futbolística. Miguel Ángel Borja abrió el marcador a los 22 del primer tiempo y Edinson Cavani lo igualó a los 70.'),
      p('La jugada del empate quedó bajo revisión por una posible posición adelantada del uruguayo, pero el VAR convalidó el tanto tras tres minutos de revisión. Marcelo Gallardo y Diego Martínez evitaron declaraciones tras el partido.'),
      p('Con el resultado, ambos quedan a tres puntos de Estudiantes, líder de la Copa de la Liga.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80&auto=format&fit=crop',
      alt: 'Estadio de fútbol lleno durante un partido nocturno',
      caption: 'El Monumental, con 84 mil espectadores.',
    },
    autor: author('lucia-pellegrini'),
    categoria: cat('deportes'),
    tags: ['superclasico', 'river', 'boca', 'futbol'],
    fechaPublicacion: '2026-05-05T22:55:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 4,
  },
  {
    _id: 'art-mercosur-ue',
    titulo: 'Argentina y Brasil acordaron destrabar el Mercosur con la UE en 30 días',
    slug: 'mercosur-ue-acuerdo-30-dias',
    kicker: 'Cumbre regional',
    copete:
      'Reunión de Milei y Lula en Brasilia. Las cancillerías trabajan en la ratificación parlamentaria. Paraguay y Uruguay aún no confirmaron su acompañamiento.',
    contenido: [
      p('Tras tres horas de reunión bilateral en el Palacio de Itamaraty, los presidentes Javier Milei y Luiz Inácio Lula da Silva acordaron acelerar la ratificación parlamentaria del acuerdo Mercosur-Unión Europea, en un plazo no mayor a 30 días.'),
      p('Las cancillerías de ambos países trabajarán en una cláusula bilateral complementaria sobre comercio agrícola. Paraguay y Uruguay aún no confirmaron si acompañarán los tiempos propuestos.'),
      p('La Comisión Europea recibió la noticia como "una señal positiva" y confirmó que sus 27 Estados miembros tienen los textos listos para tratamiento.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1494172961521-33799ddd43a5?w=1600&q=80&auto=format&fit=crop',
      alt: 'Banderas de países en un evento internacional',
      caption: 'Reunión bilateral en el Palacio de Itamaraty.',
    },
    autor: author('maria-fernanda-ruiz'),
    categoria: cat('mundo'),
    tags: ['mercosur', 'union-europea', 'milei', 'lula', 'brasil', 'investigacion'],
    fechaPublicacion: '2026-05-06T09:45:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 5,
  },
  {
    _id: 'op-cosquin-2026',
    titulo: 'Cosquín 2026 y la patria que insiste en cantarse a sí misma',
    slug: 'cosquin-2026-patria-cantada',
    kicker: 'Opinión',
    copete:
      'El festival cerró con 25 mil personas en la Próspero Molina. Más allá de los nombres en cartel, lo que quedó fue la persistencia de una identidad que el algoritmo no domestica.',
    contenido: [
      p('Hay algo profundamente extemporáneo en Cosquín, y eso es exactamente lo que lo vuelve necesario. En un país donde las plataformas dictan qué se escucha y qué se olvida en cuestión de semanas, una plaza que cada año se llena para escuchar las mismas zambas y chacareras es casi una declaración política.'),
      p('La edición 2026 cerró el sábado con la consagración de Soledad Pastorutti — su tercera Camino al Andar — y la presentación del trío de violinistas chaqueños. Pero más allá de los nombres del cartel, lo que quedó fue otra cosa: la persistencia de una identidad cultural que no necesita validarse en TikTok para existir.'),
      p('Quizás esa sea la verdadera consagración: la de un país que sigue cantándose a sí mismo aunque nadie lo viralice.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&q=80&auto=format&fit=crop',
      alt: 'Multitud iluminada durante un concierto al aire libre',
      caption: 'La Próspero Molina, con 25 mil personas.',
    },
    autor: author('lucia-pellegrini'),
    categoria: cat('cultura'),
    tags: ['opinion', 'cosquin', 'folclore', 'cordoba'],
    fechaPublicacion: '2026-05-06T06:00:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 4,
  },
  {
    _id: 'op-ancla-cambiaria',
    titulo: 'El ancla cambiaria, la inflación y el invierno que viene',
    slug: 'ancla-cambiaria-inflacion-invierno',
    kicker: 'Análisis',
    copete:
      'El crawling peg al 1% mensual sigue sosteniendo la desaceleración del IPC. La pregunta es por cuánto tiempo más, y a qué costo en términos de competitividad y reservas.',
    contenido: [
      p('El dato del IPC de abril, 1,9%, vuelve a confirmar que el ancla cambiaria es la principal herramienta antiinflacionaria del Gobierno. El crawling peg del 1% mensual mantiene a raya las expectativas y le pone un techo a los aumentos en bienes transables.'),
      p('El problema es la sustentabilidad. Con un peso cada vez más apreciado en términos reales, el sector exportador comienza a quejarse y las reservas netas siguen sin recuperarse al ritmo necesario.'),
      p('El invierno trae tres riesgos en simultáneo: caída estacional de exportaciones agrícolas, vencimientos de deuda en moneda extranjera y un escenario electoral que invita a las correcciones tarde y mal. Si el esquema se sostiene, será más por audacia que por método.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1554260570-e9689a3418b8?w=1600&q=80&auto=format&fit=crop',
      alt: 'Detalle de billetes de pesos argentinos sobre fondo oscuro',
      caption: 'El ancla cambiaria sigue siendo la herramienta central.',
    },
    autor: author('diego-sandoval'),
    categoria: cat('economia'),
    tags: ['opinion', 'inflacion', 'cambio', 'macroeconomia'],
    fechaPublicacion: '2026-05-06T07:30:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 6,
  },
  {
    _id: 'op-patagonia-federal',
    titulo: 'Patagonia: del Eldorado del crudo al desafío de un proyecto federal',
    slug: 'patagonia-eldorado-crudo-proyecto-federal',
    kicker: 'Mirada',
    copete:
      'Vaca Muerta produce regalías récord pero las provincias siguen pidiendo una nueva ley de coparticipación. La macro nacional descansa sobre territorios que la política central ignora.',
    contenido: [
      p('Vaca Muerta acaba de marcar su pico productivo histórico. Neuquén factura regalías que cuadruplican las de hace cinco años. Y, sin embargo, en Añelo siguen sin agua corriente, las rutas a Loma Campana son las mismas que en 2014, y la provincia reclama una nueva ley de coparticipación que el centralismo de turno se niega a discutir.'),
      p('La paradoja patagónica es vieja pero se agudiza: territorios que sostienen la macro nacional son los que menos influencia tienen sobre las decisiones que los afectan.'),
      p('Mientras se festeja desde Buenos Aires el récord de barriles, en la cuenca neuquina la pregunta es otra: ¿qué quedará cuando el petróleo baje? Sin un proyecto federal que vaya más allá del extractivismo, la respuesta da miedo.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&q=80&auto=format&fit=crop',
      alt: 'Estepa patagónica con cielo amplio al atardecer',
      caption: 'La paradoja patagónica: produce mucho, decide poco.',
    },
    autor: author('alejandro-bermudez'),
    categoria: cat('provincias'),
    tags: ['opinion', 'patagonia', 'federalismo', 'vaca-muerta'],
    fechaPublicacion: '2026-05-05T20:00:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 5,
  },
  {
    _id: 'art-sobreprecios-obra-publica',
    titulo: 'Sobreprecios en obra pública: una auditoría detectó $4.200 millones en desvíos',
    slug: 'sobreprecios-obra-publica-auditoria-2026',
    kicker: 'Investigación',
    copete:
      'El informe de la AGN abarca 47 contratos firmados entre 2022 y 2024 en cinco provincias. Detectó sobrecostos en obras viales y hospitales. La Justicia ya pidió toda la documentación.',
    contenido: [
      p('La Auditoría General de la Nación (AGN) presentó esta semana un informe que detectó sobreprecios por $4.200 millones en 47 contratos de obra pública firmados entre 2022 y 2024 en cinco provincias del centro y norte del país.'),
      p('Las irregularidades se concentran en obras viales (rutas y autopistas) y construcción de hospitales públicos. En 12 casos los sobreprecios superan el 35% respecto del valor de mercado al momento de la licitación.'),
      p('Los juzgados federales de Buenos Aires, Córdoba y Salta solicitaron formalmente toda la documentación. Tres ex funcionarios fueron citados a indagatoria para las próximas semanas.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1200&q=80&auto=format',
      alt: 'Vista aérea de maquinaria pesada en una autopista en construcción',
      caption: 'Foto: Unsplash',
    },
    autor: author('maria-fernanda-ruiz'),
    categoria: cat('politica'),
    tags: ['investigacion', 'auditoria', 'obra-publica', 'corrupcion'],
    fechaPublicacion: '2026-05-06T16:00:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 8,
  },
  {
    _id: 'art-litio-regalias-noa',
    titulo: 'Litio: cómo se reparten las regalías entre Catamarca, Salta y Jujuy',
    slug: 'litio-regalias-catamarca-salta-jujuy',
    kicker: 'Triángulo del litio',
    copete:
      'Una investigación a tres voces revela los acuerdos provinciales con las mineras y los porcentajes que cada gobierno se queda. La diferencia entre provincias llega al 11% en algunos contratos.',
    contenido: [
      p('Las tres provincias del Triángulo del Litio (Catamarca, Salta y Jujuy) firmaron acuerdos distintos con las empresas mineras que explotan el mineral. La diferencia entre el porcentaje de regalías que cobra cada provincia llega al 11% en los contratos más recientes.'),
      p('El acceso a los acuerdos —obtenido por pedido de información pública— muestra que Catamarca cobra entre 3,5% y 7,5% del valor exportado, mientras Salta firmó cláusulas que permiten descuentos por inversión en infraestructura local.'),
      p('Los gobernadores reclaman una ley federal que unifique criterios y evite la "competencia desleal" entre provincias por atraer inversiones. La discusión se postergó dos años en el Congreso.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80&auto=format',
      alt: 'Estepa árida del norte argentino al amanecer',
      caption: 'Foto: Unsplash',
    },
    autor: author('alejandro-bermudez'),
    categoria: cat('provincias'),
    tags: ['investigacion', 'litio', 'noa', 'mineria', 'regalias'],
    fechaPublicacion: '2026-05-06T14:00:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 10,
  },
  {
    _id: 'jud-corte-licencias-oncologia',
    titulo: 'La Corte avaló las licencias médicas extendidas por enfermedad oncológica',
    slug: 'corte-suprema-licencias-medicas-oncologia',
    kicker: 'Justicia',
    copete:
      'El fallo unánime resuelve un viejo reclamo de pacientes y familias. Obliga a obras sociales y prepagas a cubrir tratamientos extendidos sin tope de tiempo.',
    contenido: [
      p('La Corte Suprema de Justicia falló por unanimidad a favor de extender las licencias médicas para pacientes oncológicos sin tope temporal, en una causa que llevaba siete años en el sistema judicial.'),
      p('La decisión obliga a obras sociales y empresas de medicina prepaga a cubrir el tratamiento completo —incluido seguimiento post-tratamiento— sin aplicar los topes de 24 meses que figuraban en la mayoría de los planes.'),
      p('Organizaciones de pacientes celebraron el fallo como "un piso de dignidad". Las cámaras del sector estiman un impacto económico que tendrá que ser absorbido en las próximas adecuaciones de cuotas.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1589216532372-1c2a367900d9?w=1200&q=80&auto=format',
      alt: 'Mazo y balanza de la justicia sobre escritorio de tribunal',
      caption: 'Foto: Unsplash',
    },
    autor: author('tomas-aguirre'),
    categoria: cat('sociedad'),
    tags: ['judicial', 'corte-suprema', 'salud'],
    fechaPublicacion: '2026-05-06T19:30:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 5,
  },
  {
    _id: 'jud-procesamiento-ex-viceministro',
    titulo: 'Procesaron a un ex viceministro por enriquecimiento ilícito y malversación',
    slug: 'ex-viceministro-procesamiento-enriquecimiento-ilicito',
    kicker: 'Causa Federal',
    copete:
      'El Juzgado Federal N°4 dictó embargo por $890 millones y prohibición de salida del país. La defensa anticipó que apelará en Casación dentro de los próximos diez días.',
    contenido: [
      p('El Juzgado Federal N°4, a cargo del juez Sebastián Casanello, dictó este lunes el procesamiento del ex viceministro Roberto Lemos por los delitos de enriquecimiento ilícito y malversación de caudales públicos durante su gestión entre 2018 y 2022.'),
      p('La medida incluye un embargo preventivo por $890 millones sobre bienes inmuebles, vehículos y cuentas bancarias del ex funcionario. Adicionalmente se le impuso prohibición de salida del país.'),
      p('La defensa, encabezada por el estudio jurídico Marin & Asociados, anticipó que apelará la decisión ante la Cámara Federal de Casación en los próximos diez días hábiles.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1200&q=80&auto=format',
      alt: 'Pasillo de tribunales con luz tenue',
      caption: 'Foto: Unsplash',
    },
    autor: author('tomas-aguirre'),
    categoria: cat('politica'),
    tags: ['judicial', 'corrupcion', 'comodoro-py'],
    fechaPublicacion: '2026-05-06T11:00:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 6,
  },
  {
    _id: 'jud-sentencia-femicidio-cordoba',
    titulo: 'Córdoba: prisión perpetua para el femicida de Lucía Pérez',
    slug: 'sentencia-femicidio-cordoba-perpetua',
    kicker: 'Tribunal Oral',
    copete:
      'Después de tres años de proceso, la familia de la víctima escuchó la condena en una sala desbordada. Las organizaciones de mujeres marcharon al Palacio de Justicia.',
    contenido: [
      p('El Tribunal Oral N°3 de Córdoba condenó este martes a prisión perpetua a Mariano S., autor del femicidio de Lucía Pérez, ocurrido en mayo de 2023 en el barrio Nueva Córdoba.'),
      p('La sentencia llega después de tres años de proceso judicial en los que la familia de la víctima atravesó pericias, careos y postergaciones. La sala estaba desbordada de organizaciones feministas y vecinos del barrio.'),
      p('Afuera del Palacio de Justicia, una marcha de unas 4.000 personas acompañó la lectura del fallo. Las organizaciones reclamaron políticas más enérgicas de prevención y mejor trato judicial a las denunciantes.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80&auto=format',
      alt: 'Carpetas y expedientes apilados sobre un escritorio',
      caption: 'Foto: Unsplash',
    },
    autor: author('lucia-pellegrini'),
    categoria: cat('sociedad'),
    tags: ['judicial', 'femicidio', 'cordoba', 'genero'],
    fechaPublicacion: '2026-05-06T17:00:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 4,
  },
  {
    _id: 'jud-camara-mendoza-gasoducto',
    titulo: 'Mendoza: la Cámara Federal destrabó el gasoducto frenado hace seis meses',
    slug: 'camara-federal-mendoza-cautelar-gasoducto',
    kicker: 'Energía y ambiente',
    copete:
      'El fallo revoca la medida cautelar interpuesta por organizaciones ambientalistas. Las empresas constructoras retoman la obra esta semana. Las ONG anticipan recurso en la Corte.',
    contenido: [
      p('La Cámara Federal de Mendoza revocó la medida cautelar que mantenía paralizada la obra del gasoducto Cuyo-Centro desde noviembre del año pasado, cuando una presentación de organizaciones ambientalistas frenó la construcción.'),
      p('El fallo, firmado por dos de los tres camaristas, sostiene que las empresas cumplieron con los procedimientos de evaluación de impacto ambiental aprobados por la provincia y por la Secretaría de Ambiente nacional.'),
      p('Las organizaciones que originaron la medida cautelar anticiparon que llevarán el caso a la Corte Suprema. Mientras tanto, la constructora líder anunció que retoma los trabajos esta semana con un cronograma acelerado.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80&auto=format',
      alt: 'Tendido de gasoducto a través de un paisaje montañoso',
      caption: 'Foto: Unsplash',
    },
    autor: author('tomas-aguirre'),
    categoria: cat('politica'),
    tags: ['judicial', 'mendoza', 'cuyo', 'energia', 'ambiente'],
    fechaPublicacion: '2026-05-06T13:30:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 5,
  },
  {
    _id: 'jud-detenidos-rosario-fiscal',
    titulo: 'Cayó en Rosario la banda señalada por el ataque al fiscal antinarcóticos',
    slug: 'detencion-banda-rosario-ataque-fiscal',
    kicker: 'Narcocriminalidad',
    copete:
      'Diez personas quedaron a disposición del juez federal. La operación incluyó allanamientos simultáneos en cuatro barrios. Secuestraron armas largas, dinero y vehículos.',
    contenido: [
      p('Un operativo conjunto de Gendarmería, Policía Federal y la Agencia de Investigación Criminal de Santa Fe terminó con la detención de diez personas señaladas como integrantes de la banda que atacó la casa del fiscal antinarcóticos Pablo Aguilera el mes pasado.'),
      p('La operación incluyó once allanamientos simultáneos en cuatro barrios del sur y oeste de Rosario. En total se secuestraron seis armas largas, tres pistolas, cinco vehículos y aproximadamente $42 millones en efectivo.'),
      p('El juez federal interviniente dispuso la prisión preventiva para los diez detenidos. La fiscalía evalúa solicitar la incorporación de cargos por asociación ilícita además del intento de homicidio del funcionario judicial.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1453873531674-2151bcd01707?w=1200&q=80&auto=format',
      alt: 'Patrullero policial con luces de emergencia en una calle nocturna',
      caption: 'Foto: Unsplash',
    },
    autor: author('lucia-pellegrini'),
    categoria: cat('sociedad'),
    tags: ['judicial', 'rosario', 'santa-fe', 'narcotrafico'],
    fechaPublicacion: '2026-05-06T22:00:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 5,
  },
  {
    _id: 'esp-cine-argentino-festivales-2026',
    titulo: 'El cine argentino llega a Cannes y Venecia con tres títulos en competencia oficial',
    slug: 'cine-argentino-cannes-venecia-2026',
    kicker: 'Industria audiovisual',
    copete:
      'La selección incluye una ópera prima cordobesa, un documental sobre el último Mundial y la nueva película de Lucrecia Martel. El INCAA y los festivales celebran la presencia local en una temporada compleja.',
    contenido: [
      p('La temporada europea de festivales 2026 confirmó la selección de tres películas argentinas en competencias oficiales: "La hija que no fue" de Manuela Irianni en la Quincena de Realizadores de Cannes, "El partido de todos" de Andrés Di Tella en la sección Orizzonti de Venecia, y la nueva obra de Lucrecia Martel —cuyo título sigue bajo reserva— como una de las apuestas fuertes de la competencia oficial veneciana.'),
      {
        _type: 'quote',
        text: 'Es la mayor presencia argentina en los festivales clase A desde 2018. Lo notable es que ocurre en un año en el que el sector pasó por todas.',
        cite: 'Carolina Costa, programadora del BAFICI',
      },
      p('La noticia llega en un contexto difícil para el cine local: el INCAA atraviesa una reestructuración profunda y los presupuestos de fomento sufrieron recortes en los últimos dos ejercicios. La presencia internacional vuelve a reabrir el debate sobre cómo sostener una industria que produce con menos pero sigue compitiendo en las grandes ligas.'),
      p('Las funciones de prensa empiezan en Cannes el 14 de mayo y en Venecia a fines de agosto.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&q=80&auto=format&fit=crop',
      alt: 'Asientos rojos vacíos en una sala de cine antes de la proyección',
      caption: 'Foto: Unsplash',
    },
    autor: author('lucia-pellegrini'),
    categoria: cat('espectaculos'),
    tags: ['cine', 'cannes', 'venecia', 'incaa', 'festivales'],
    fechaPublicacion: '2026-05-06T15:30:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 5,
  },
  {
    _id: 'esp-bizarrap-session-mayo-2026',
    titulo: 'Bizarrap rompió récord global con su nueva BZRP Session: 80 millones de reproducciones en 24 horas',
    slug: 'bizarrap-nueva-session-record-mayo-2026',
    kicker: 'Música',
    copete:
      'La sesión número 64, con una artista internacional cuya identidad se mantuvo en secreto hasta el lanzamiento, batió el récord histórico del canal. Spotify y YouTube confirmaron las cifras.',
    contenido: [
      p('La BZRP Music Session #64 alcanzó las 80 millones de reproducciones combinadas en YouTube y Spotify durante sus primeras 24 horas, según los datos consolidados que difundieron ambas plataformas. Se trata del mayor estreno en la historia del proyecto del productor argentino Gonzalo Conde.'),
      p('La identidad de la artista invitada —que Bizarrap mantuvo bajo reserva absoluta hasta el momento del lanzamiento— resultó ser una colaboración con una de las cantantes pop más vendidas de la última década, en su primera incursión en español. La sesión se grabó entre febrero y marzo en el estudio del productor en Ramos Mejía.'),
      {
        _type: 'quote',
        text: 'Lo que hizo Bizarrap es transformar un formato de YouTube en una plataforma de lanzamientos globales. Hoy una sesión suya equivale a un single major.',
        cite: 'Hernán Panessi, periodista de cultura digital',
      },
      p('Con esta sesión, el productor alcanza los 28 millones de suscriptores en YouTube y se consolida como el artista argentino más escuchado de la historia en plataformas digitales, superando incluso al Gustavo Cerati post-mortem en streams totales.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=80&auto=format&fit=crop',
      alt: 'Mesa de mezcla de un estudio de música con luces tenues',
      caption: 'Foto: Unsplash',
    },
    autor: author('sofia-andrade'),
    categoria: cat('espectaculos'),
    tags: ['musica', 'bizarrap', 'streaming', 'trap', 'spotify'],
    fechaPublicacion: '2026-05-07T08:00:00-03:00',
    esDestacada: true,
    esCoverDelDia: false,
    tiempoLectura: 4,
  },
  {
    _id: 'esp-netflix-el-reino-temporada-3',
    titulo: 'Netflix confirmó la tercera temporada de "El reino" para fin de año',
    slug: 'netflix-el-reino-tercera-temporada-confirmada',
    kicker: 'Streaming',
    copete:
      'La serie creada por Marcelo Piñeyro y Claudia Piñeiro vuelve con seis episodios y un nuevo elenco que incluye a Cecilia Roth y Joaquín Furriel. El rodaje arranca en julio.',
    contenido: [
      p('Netflix confirmó este martes la producción de una tercera temporada de "El reino", la serie política argentina creada por Marcelo Piñeyro y Claudia Piñeiro que en sus dos primeras entregas se convirtió en uno de los grandes fenómenos locales de la plataforma.'),
      p('La nueva temporada tendrá seis episodios y suma a Cecilia Roth y Joaquín Furriel a un elenco que continuará liderado por Diego Peretti y Mercedes Morán. Según los productores, la trama se mueve diez años después del cierre de la segunda temporada y propone una mirada sobre el poder político en clave generacional.'),
      p('El rodaje arranca el 14 de julio en locaciones de Buenos Aires, Tigre y Córdoba. El estreno está pautado para los últimos días de noviembre, en simultáneo con todos los territorios de Latinoamérica y España.'),
      {
        _type: 'quote',
        text: 'Volvemos a un universo que sentíamos cerrado, pero la realidad nos empujó a seguir contándolo. La política argentina nos dio material nuevo.',
        cite: 'Claudia Piñeiro, co-creadora de la serie',
      },
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=1600&q=80&auto=format&fit=crop',
      alt: 'Pantalla de televisión mostrando el menú de una plataforma de streaming en una sala oscura',
      caption: 'Foto: Unsplash',
    },
    autor: author('sofia-andrade'),
    categoria: cat('espectaculos'),
    tags: ['streaming', 'netflix', 'series', 'el-reino', 'pineyro'],
    fechaPublicacion: '2026-05-06T12:00:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 4,
  },
  {
    _id: 'esp-cosquin-2026-cierre',
    titulo: 'Cosquín 2026 cerró con récord de público y la consagración de Soledad Pastorutti',
    slug: 'cosquin-2026-cierre-soledad-pastorutti',
    kicker: 'Festival nacional del folclore',
    copete:
      'La Próspero Molina recibió a 175 mil personas en las nueve noches. La Sole se llevó su tercer Camino al Andar. El presupuesto del año que viene ya está bajo discusión.',
    contenido: [
      p('El Festival Nacional de Folclore de Cosquín cerró su edición 2026 con la consagración de Soledad Pastorutti, que recibió por tercera vez el premio Camino al Andar, y un balance de público que superó las expectativas: 175 mil espectadores acumulados a lo largo de las nueve noches en la Plaza Próspero Molina.'),
      p('El cierre, el sábado por la noche, tuvo como números fuertes al trío de violinistas chaqueños "Los del Yacaré", a la cantautora Mariana Cayón debutando en la grilla principal, y un emotivo homenaje a Mercedes Sosa a 90 años de su nacimiento, con la participación de Liliana Herrero y la Orquesta Folklórica de la Universidad Nacional de Córdoba.'),
      {
        _type: 'image',
        src: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&q=80&auto=format&fit=crop',
        alt: 'Multitud iluminada durante un concierto al aire libre',
        caption: 'La Plaza Próspero Molina, durante una de las nueve noches del festival.',
      },
      p('La Comisión Municipal de Folclore informó que la transmisión por streaming alcanzó 4,2 millones de reproducciones únicas, un crecimiento del 38% respecto del año pasado. La discusión por el presupuesto de la edición 2027 ya está abierta entre la municipalidad y la provincia.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1600&q=80&auto=format&fit=crop',
      alt: 'Vista nocturna de un escenario al aire libre con luces sobre el público',
      caption: 'Foto: Unsplash',
    },
    autor: author('lucia-pellegrini'),
    categoria: cat('espectaculos'),
    tags: ['cosquin', 'folclore', 'cordoba', 'soledad-pastorutti', 'festivales'],
    fechaPublicacion: '2026-05-05T23:00:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 4,
  },
  {
    _id: 'esp-darin-cervantes-2026',
    titulo: 'Ricardo Darín debuta en mayo con una nueva obra de Mauricio Kartun en el Cervantes',
    slug: 'ricardo-darin-debut-teatral-cervantes-2026',
    kicker: 'Teatro',
    copete:
      'Es el primer regreso de Darín a las tablas en seis años. La obra, "Las noches de la paciencia", se estrena el 22 de mayo. Las entradas se agotaron en las primeras tres horas de venta.',
    contenido: [
      p('Ricardo Darín vuelve al escenario después de seis años con "Las noches de la paciencia", una obra escrita y dirigida especialmente para él por Mauricio Kartun. El estreno, en el Teatro Nacional Cervantes, está pautado para el jueves 22 de mayo.'),
      p('La pieza —un monólogo extendido con tres apariciones secundarias— aborda la figura de un escritor argentino que, tras décadas de éxito, se encuentra en un cuarto de hotel preparando un discurso que no quiere dar. Kartun la describe como "una conversación con la propia obra y con el oficio".'),
      {
        _type: 'quote',
        text: 'Volver al teatro después de tanto tiempo es como aprender a caminar otra vez. Pero hay un texto de Kartun: con eso te alcanza.',
        cite: 'Ricardo Darín, en la conferencia de presentación',
      },
      p('La función será de jueves a domingos durante seis semanas. Las entradas se pusieron a la venta el lunes a las 10 de la mañana y se agotaron antes de la una de la tarde, según informó la sala. Ya se evalúa una posible extensión a un segundo bloque de funciones en julio.'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1600&q=80&auto=format&fit=crop',
      alt: 'Telón rojo y luces de un escenario teatral antes de la función',
      caption: 'Foto: Unsplash',
    },
    autor: author('sofia-andrade'),
    categoria: cat('espectaculos'),
    tags: ['teatro', 'darin', 'kartun', 'cervantes', 'estrenos'],
    fechaPublicacion: '2026-05-06T10:00:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 4,
  },
  {
    _id: 'esp-gran-hermano-eliminacion-mayo-2026',
    titulo: 'Gran Hermano: la eliminación del domingo dejó la casa con cinco participantes y rating récord',
    slug: 'gran-hermano-eliminacion-domingo-mayo-2026',
    kicker: 'Televisión',
    copete:
      'Telefe registró 22,4 puntos en el prime time del domingo. La final está pautada para el 18 de mayo. La discusión por el formato del año que viene ya empezó en las redes.',
    contenido: [
      p('La gala de eliminación de "Gran Hermano" del domingo a la noche dejó la casa de Martínez con cinco participantes y un rating de 22,4 puntos para Telefe, el más alto del ciclo y uno de los picos televisivos de los últimos doce meses fuera de la programación deportiva.'),
      p('La participante eliminada, Camila Pereyra, salió con el 58% de los votos negativos en una placa de tres nominados. La conducción a cargo de Santiago del Moro estiró la gala más de lo previsto por una intervención de "Gran Hermano" sobre las reglas de la próxima semana, que adelanta una posible doble eliminación.'),
      p('La final está pautada para el domingo 18 de mayo, también en horario central. En redes, la discusión por la fórmula del programa para 2027 ya empezó: el productor general Diego Guebel adelantó que está estudiando un formato más corto, "más cercano al ritmo del consumo digital".'),
    ],
    imagenPrincipal: {
      src: 'https://images.unsplash.com/photo-1559519529-0936e4058364?w=1600&q=80&auto=format&fit=crop',
      alt: 'Cámaras profesionales de televisión en un set de estudio iluminado',
      caption: 'Foto: Unsplash',
    },
    autor: author('sofia-andrade'),
    categoria: cat('espectaculos'),
    tags: ['television', 'gran-hermano', 'telefe', 'rating', 'realities'],
    fechaPublicacion: '2026-05-07T01:30:00-03:00',
    esDestacada: false,
    esCoverDelDia: false,
    tiempoLectura: 3,
  },
];

// Inyecta width/height/lqip por defecto donde no estén declarados, para
// que los componentes puedan renderizar siempre con dimensiones explícitas
// (CLS = 0). Aplica tanto a imagenPrincipal como a image blocks dentro
// de contenido. Si una nota declara sus propios valores, se respetan.
function withSampleImageMetadata(a: Article): Article {
  return {
    ...a,
    imagenPrincipal: {
      ...a.imagenPrincipal,
      width: a.imagenPrincipal.width ?? SAMPLE_IMG_W,
      height: a.imagenPrincipal.height ?? SAMPLE_IMG_H,
      lqip: a.imagenPrincipal.lqip ?? SAMPLE_IMG_LQIP,
    },
    contenido: a.contenido.map((b) =>
      b._type === 'image'
        ? {
            ...b,
            width: b.width ?? SAMPLE_IMG_W,
            height: b.height ?? SAMPLE_IMG_H,
            lqip: b.lqip ?? SAMPLE_IMG_LQIP,
          }
        : b,
    ),
  };
}

export const articles: Article[] = _rawArticles.map(withSampleImageMetadata);

const sortedByDateDesc = [...articles].sort(
  (a, b) => new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime(),
);

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(slug: CategorySlug): Article[] {
  return sortedByDateDesc.filter((a) => a.categoria.slug === slug);
}

export function getArticlesByAuthor(slug: string): Article[] {
  return sortedByDateDesc.filter((a) => a.autor.slug === slug);
}

export function getCoverArticle(): Article | undefined {
  return articles.find((a) => a.esCoverDelDia);
}

export function getDestacadas(limit = 3): Article[] {
  return sortedByDateDesc.filter((a) => a.esDestacada).slice(0, limit);
}

export function getOpinion(limit = 3): Article[] {
  return sortedByDateDesc.filter((a) => a.tags.includes('opinion')).slice(0, limit);
}

export function getLatest(limit = 8, excludeOpinion = true): Article[] {
  const pool = excludeOpinion
    ? sortedByDateDesc.filter((a) => !a.tags.includes('opinion'))
    : sortedByDateDesc;
  return pool.slice(0, limit);
}

export function getMostRead(limit = 5): Article[] {
  return sortedByDateDesc.slice(0, limit);
}

export function getRelated(article: Article, limit = 3): Article[] {
  return sortedByDateDesc
    .filter((a) => a.slug !== article.slug && a.categoria.slug === article.categoria.slug)
    .slice(0, limit);
}

export function getLatestExcluding(slug: CategorySlug, limit = 3): Article[] {
  return sortedByDateDesc.filter((a) => a.categoria.slug !== slug).slice(0, limit);
}
