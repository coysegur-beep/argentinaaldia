import type { APIRoute } from 'astro';

const aiBots = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'anthropic-ai',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'PerplexityBot',
  'Bytespider',
  'Amazonbot',
  'FacebookBot',
];

export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL('https://argentinaaldia.com'))
    .toString()
    .replace(/\/$/, '');

  const blocks = aiBots
    .map((b) => `User-agent: ${b}\nDisallow: /\n`)
    .join('\n');

  const txt = `# robots.txt — Argentina al día
# Crawlers tradicionales (Google, Bing, DuckDuckGo, etc.): permitidos por defecto.
# Crawlers de IA / entrenamiento de modelos: bloqueados.
# facebookexternalhit (preview de links en FB/WhatsApp): permitido por default,
#   no incluido en la lista de bloqueo.

${blocks}
User-agent: *
Allow: /

Sitemap: ${origin}/sitemap-index.xml
Sitemap: ${origin}/sitemap-news.xml
`;

  return new Response(txt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
