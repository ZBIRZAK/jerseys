import { importedProducts } from './importedProducts.js';
import { importedTracksuits } from './importedTracksuits.js';

export const teams = [
  { id: 'morocco', name: 'Morocco', code: 'MAR', colors: ['#d71920', '#087a4a'], logo: '/team-logos/morocco.webp' },
  { id: 'france', name: 'France', code: 'FRA', colors: ['#133a8a', '#e62b3a'], logo: '/team-logos/france.webp' },
  { id: 'brazil', name: 'Brazil', code: 'BRA', colors: ['#f5d22e', '#16834b'], logo: '/team-logos/brazil.svg' },
  { id: 'argentina', name: 'Argentina', code: 'ARG', colors: ['#75b9e7', '#ffffff'], logo: '/team-logos/argentina.svg' },
  { id: 'portugal', name: 'Portugal', code: 'POR', colors: ['#ce1733', '#13874b'], logo: '/team-logos/portugal.svg' },
  { id: 'spain', name: 'Spain', code: 'ESP', colors: ['#df2638', '#f5c62c'], logo: '/team-logos/spain.svg' },
  { id: 'england', name: 'England', code: 'ENG', colors: ['#f4f4f2', '#d51d36'], logo: '/team-logos/england.svg' },
  { id: 'germany', name: 'Germany', code: 'GER', colors: ['#171717', '#d7aa34'], logo: '/team-logos/germany.svg' },
  { id: 'italy', name: 'Italy', code: 'ITA', colors: ['#1765ab', '#ffffff'], logo: '/team-logos/italy.svg' },
  { id: 'senegal', name: 'Senegal', code: 'SEN', colors: ['#16804f', '#f0c72e'], logo: '/team-logos/senegal.webp' },
  { id: 'algeria', name: 'Algeria', code: 'ALG', colors: ['#16864c', '#ffffff'], logo: '/team-logos/algeria.webp' },
  { id: 'egypt', name: 'Egypt', code: 'EGY', colors: ['#cf202f', '#111111'], logo: '/team-logos/egypt.webp' },
  { id: 'nigeria', name: 'Nigeria', code: 'NGA', colors: ['#12864b', '#ffffff'], logo: '/team-logos/nigeria.webp' },
  { id: 'japan', name: 'Japan', code: 'JPN', colors: ['#173a8f', '#d51e3b'], logo: '/team-logos/japan.webp' },
  { id: 'south-korea', name: 'South Korea', code: 'KOR', colors: ['#d9233f', '#173d85'], logo: '/team-logos/south-korea.webp' },
  { id: 'mexico', name: 'Mexico', code: 'MEX', colors: ['#087b4b', '#d62435'], logo: '/team-logos/mexico.webp' },
  { id: 'usa', name: 'United States', code: 'USA', colors: ['#203e83', '#d3283e'], logo: '/team-logos/usa.webp' },
  { id: 'norway', name: 'Norway', code: 'NOR', colors: ['#ba0c2f', '#ffffff'], logo: '/team-logos/norway.svg' },
  { id: 'netherlands', name: 'Netherlands', code: 'NED', colors: ['#f36d21', '#173c87'], logo: '/team-logos/netherlands.webp' },
  { id: 'belgium', name: 'Belgium', code: 'BEL', colors: ['#171717', '#d82735'], logo: '/team-logos/belgium.webp' },
  { id: 'croatia', name: 'Croatia', code: 'CRO', colors: ['#d61f35', '#ffffff'], logo: '/team-logos/croatia.webp' },
];

export const categories = [
  { id: 'jerseys', name: 'Jerseys', sortOrder: 1 },
  { id: 'sandals', name: 'Sandals', sortOrder: 2 },
  { id: 'tattoos', name: 'Tattoos', sortOrder: 3 },
  { id: 'shoes', name: 'Shoes', sortOrder: 4 },
  { id: 'survette', name: 'Survette', sortOrder: 5 },
];

export const heroSlides = [
  {
    id: 'france-home-hero',
    image: '/product-gallery/france/france-home-alt-2.webp',
    alt: 'Model wearing the France home jersey',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'brazil-away-hero',
    image: '/product-gallery/brazil/brazil-away-alt-2.webp',
    alt: 'Model wearing the Brazil away jersey',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'brazil-hoodie-hero',
    image: '/product-gallery/brazil/brazil-yellow-hoodie-alt-2.webp',
    alt: 'Model wearing the Brazil yellow match hoodie',
    sortOrder: 3,
    isActive: true,
  },
];

const jerseyByTeam = {
  morocco: '/jerseys/morocco-home.webp',
  france: '/jerseys/france-home.webp',
  brazil: '/jerseys/brazil-home.webp',
  argentina: '/jerseys/argentina-home.webp',
  portugal: '/jerseys/portugal-home.webp',
  spain: '/jerseys/spain-home.webp',
  england: '/jerseys/england-home.webp',
  germany: '/jerseys/germany-home.webp',
  italy: '/jerseys/italy-home.webp',
  senegal: '/jerseys/senegal-home.webp',
  algeria: '/jerseys/algeria-home.webp',
  egypt: '/jerseys/egypt-home.webp',
  nigeria: '/jerseys/nigeria-home.webp',
  japan: '/jerseys/japan-home.webp',
  'south-korea': '/jerseys/south-korea-home.webp',
  mexico: '/jerseys/mexico-home.webp',
  usa: '/jerseys/usa-home.webp',
  netherlands: '/jerseys/netherlands-home.webp',
  belgium: '/jerseys/belgium-home.webp',
  croatia: '/jerseys/croatia-home.webp',
};

export const jerseyBackByTeam = {
  morocco: '/jerseys-back-transparent/morocco-back.webp',
  france: '/jerseys-back-transparent/france-back.webp',
  brazil: '/jerseys-back-transparent/brazil-back.webp',
  argentina: '/jerseys-back-transparent/argentina-back.webp',
  portugal: '/jerseys-back-transparent/portugal-back.webp',
  spain: '/jerseys-back-transparent/spain-back.webp',
  england: '/jerseys-back-transparent/england-back.webp',
  germany: '/jerseys-back-transparent/germany-back.webp',
  italy: '/jerseys-back-transparent/italy-back.webp',
  senegal: '/jerseys-back-transparent/senegal-back.webp',
  algeria: '/jerseys-back-transparent/algeria-back.webp',
  egypt: '/jerseys-back-transparent/egypt-back.webp',
  nigeria: '/jerseys-back-transparent/nigeria-back.webp',
  japan: '/jerseys-back-transparent/japan-back.webp',
  'south-korea': '/jerseys-back-transparent/south-korea-back.webp',
  mexico: '/jerseys-back-transparent/mexico-back.webp',
  usa: '/jerseys-back-transparent/usa-back.webp',
  netherlands: '/jerseys-back-transparent/netherlands-back.webp',
  belgium: '/jerseys-back-transparent/belgium-back.webp',
  croatia: '/jerseys-back-transparent/croatia-back.webp',
};

export const jerseyPrintByTeam = {
  morocco: { top: '29.4%', width: '36%', color: '#f6f2e8', outline: 'rgba(24, 24, 24, .78)' },
  france: { top: '29.2%', width: '35%', color: '#f7f7f5', outline: 'rgba(15, 25, 57, .85)' },
  brazil: { top: '29.8%', width: '35%', color: '#11181a', outline: 'rgba(255, 255, 255, .7)' },
  argentina: { top: '30.2%', width: '34%', color: '#121416', outline: 'rgba(255, 255, 255, .74)' },
  portugal: { top: '31.2%', width: '35%', color: '#f6f4ee', outline: 'rgba(19, 21, 21, .82)' },
  spain: { top: '30.4%', width: '35%', color: '#f6d14c', outline: 'rgba(110, 14, 22, .88)' },
  england: { top: '30%', width: '34%', color: '#b22b3a', outline: 'rgba(20, 28, 47, .82)' },
  germany: { top: '30%', width: '34%', color: '#171816', outline: 'rgba(245, 241, 225, .72)' },
  italy: { top: '29.6%', width: '35%', color: '#f4f6fb', outline: 'rgba(15, 67, 150, .88)' },
  senegal: { top: '29.5%', width: '35%', color: '#171816', outline: 'rgba(255, 255, 255, .72)' },
  algeria: { top: '30.3%', width: '35%', color: '#171816', outline: 'rgba(255, 255, 255, .72)' },
  egypt: { top: '29.7%', width: '35%', color: '#f6f4ef', outline: 'rgba(18, 18, 18, .84)' },
  nigeria: { top: '29.9%', width: '35%', color: '#f6f4ef', outline: 'rgba(16, 24, 20, .82)' },
  japan: { top: '29.3%', width: '34%', color: '#f6f5f1', outline: 'rgba(12, 20, 41, .84)' },
  'south-korea': { top: '29.1%', width: '34%', color: '#171816', outline: 'rgba(255, 255, 255, .7)' },
  mexico: { top: '29.6%', width: '37%', color: '#132316', outline: 'rgba(255, 255, 255, .64)' },
  usa: { top: '29.5%', width: '35%', color: '#171816', outline: 'rgba(255, 255, 255, .72)' },
  norway: { top: '29.6%', width: '35%', color: '#f6f4ef', outline: 'rgba(24, 24, 24, .84)' },
  netherlands: { top: '29.8%', width: '34%', color: '#101417', outline: 'rgba(255, 157, 82, .76)' },
  belgium: { top: '29.6%', width: '35%', color: '#f3efe6', outline: 'rgba(18, 18, 18, .86)' },
  croatia: { top: '30.6%', width: '35%', color: '#171816', outline: 'rgba(255, 255, 255, .72)' },
};

const photos = {
  shoes: [
    '/product-gallery/shared/shoes-primary.webp',
    '/product-gallery/shared/shoes-alt-1.webp',
    '/product-gallery/shared/shoes-alt-2.webp',
  ],
  sandals: [
    '/product-gallery/shared/sandals-primary.webp',
    '/product-gallery/shared/sandals-alt-1.webp',
    '/product-gallery/shared/sandals-alt-2.webp',
  ],
  tattoos: [
    '/product-gallery/shared/tattoos-primary.webp',
    '/product-gallery/shared/tattoos-alt-1.webp',
    '/product-gallery/shared/tattoos-alt-2.webp',
  ],
};

const franceHomeAlbumImages = [
  '/product-gallery/france/france-home-alt-2.webp',
  '/product-gallery/france/france-home-primary.webp',
  '/product-gallery/france/france-home-alt-1.webp',
  '/product-gallery/france/france-home-alt-3.webp',
  '/product-gallery/france/france-home-alt-4.webp',
  '/product-gallery/france/france-home-alt-5.webp',
  '/product-gallery/france/france-home-alt-6.webp',
  '/product-gallery/france/france-home-alt-7.webp',
  '/product-gallery/france/france-home-alt-8.webp',
];

const franceHoodieAlbumImages = [
  '/product-gallery/france/france-hoodie-primary.webp',
  '/product-gallery/france/france-hoodie-alt-1.webp',
  '/product-gallery/france/france-hoodie-alt-2.webp',
  '/product-gallery/france/france-hoodie-alt-3.webp',
  '/product-gallery/france/france-hoodie-alt-4.webp',
  '/product-gallery/france/france-hoodie-alt-5.webp',
  '/product-gallery/france/france-hoodie-alt-6.webp',
  '/product-gallery/france/france-hoodie-alt-7.webp',
];

const franceAwayAlbumImages = [
  '/product-gallery/france/france-away-alt-2.webp',
  '/product-gallery/france/france-away-primary.webp',
  '/product-gallery/france/france-away-alt-1.webp',
  '/product-gallery/france/france-away-alt-3.webp',
  '/product-gallery/france/france-away-alt-4.webp',
  '/product-gallery/france/france-away-alt-5.webp',
  '/product-gallery/france/france-away-alt-6.webp',
  '/product-gallery/france/france-away-alt-7.webp',
  '/product-gallery/france/france-away-alt-8.webp',
];

const brazilAwayAlbumImages = [
  '/product-gallery/brazil/brazil-away-alt-2.webp',
  '/product-gallery/brazil/brazil-away-primary.webp',
  '/product-gallery/brazil/brazil-away-alt-1.webp',
  '/product-gallery/brazil/brazil-away-alt-3.webp',
  '/product-gallery/brazil/brazil-away-alt-4.webp',
  '/product-gallery/brazil/brazil-away-alt-5.webp',
  '/product-gallery/brazil/brazil-away-alt-6.webp',
  '/product-gallery/brazil/brazil-away-alt-7.webp',
  '/product-gallery/brazil/brazil-away-alt-8.webp',
  '/product-gallery/brazil/brazil-away-alt-9.webp',
];

const brazilYellowHoodieAlbumImages = [
  '/product-gallery/brazil/brazil-yellow-hoodie-alt-2.webp',
  '/product-gallery/brazil/brazil-yellow-hoodie-primary.webp',
  '/product-gallery/brazil/brazil-yellow-hoodie-alt-1.webp',
  '/product-gallery/brazil/brazil-yellow-hoodie-alt-3.webp',
  '/product-gallery/brazil/brazil-yellow-hoodie-alt-4.webp',
  '/product-gallery/brazil/brazil-yellow-hoodie-alt-5.webp',
  '/product-gallery/brazil/brazil-yellow-hoodie-alt-6.webp',
  '/product-gallery/brazil/brazil-yellow-hoodie-alt-7.webp',
];

const brazilHoodieAlbumImages = [
  '/product-gallery/brazil/brazil-hoodie-alt-2.webp',
  '/product-gallery/brazil/brazil-hoodie-primary.webp',
  '/product-gallery/brazil/brazil-hoodie-alt-1.webp',
  '/product-gallery/brazil/brazil-hoodie-alt-3.webp',
  '/product-gallery/brazil/brazil-hoodie-alt-4.webp',
  '/product-gallery/brazil/brazil-hoodie-alt-5.webp',
  '/product-gallery/brazil/brazil-hoodie-alt-6.webp',
];

function buildJerseyGallery(teamId) {
  if (teamId === 'france') return franceHomeAlbumImages;
  if (teamId === 'brazil') return brazilAwayAlbumImages;
  return [jerseyByTeam[teamId], jerseyBackByTeam[teamId]].filter(Boolean);
}

function buildSecondaryFranceGallery(teamId) {
  if (teamId === 'france') return franceAwayAlbumImages;
  if (teamId === 'brazil') return brazilYellowHoodieAlbumImages;
  return buildJerseyGallery(teamId);
}

function rotateGallery(items, startIndex, count = 3) {
  return Array.from({ length: Math.min(count, items.length) }, (_, offset) => (
    items[(startIndex + offset) % items.length]
  ));
}

const generatedProducts = teams.filter((team) => jerseyByTeam[team.id]).flatMap((team, teamIndex) => [
  {
    id: `${team.id}-home`,
    teamId: team.id,
    category: 'Jerseys',
    name: team.id === 'brazil' ? `${team.name} Away Jersey 2026` : `${team.name} Home Jersey 2026`,
    price: 89,
    oldPrice: 110,
    image: buildJerseyGallery(team.id)[0],
    gallery: buildJerseyGallery(team.id),
    badge: teamIndex % 3 === 0 ? 'Bestseller' : 'New',
    color: team.colors[0],
  },
  {
    id: `${team.id}-away`,
    teamId: team.id,
    category: 'Jerseys',
    name: team.id === 'france'
      ? `${team.name} Away Jersey 2026`
      : team.id === 'brazil'
        ? `${team.name} Yellow Match Hoodie 2026`
        : `${team.name} Supporter Jersey 2026`,
    price: 84,
    image: buildSecondaryFranceGallery(team.id)[0],
    gallery: buildSecondaryFranceGallery(team.id),
    color: team.colors[1],
  },
  ...(team.id === 'france'
    ? [{
      id: `${team.id}-hoodie`,
      teamId: team.id,
      category: 'Jerseys',
      name: `${team.name} Team Hoodie 2026`,
      price: 94,
      image: franceHoodieAlbumImages[0],
      gallery: franceHoodieAlbumImages,
      badge: 'Fan favorite',
      color: team.colors[1],
    }]
    : team.id === 'brazil'
      ? [{
        id: `${team.id}-hoodie`,
        teamId: team.id,
        category: 'Jerseys',
        name: `${team.name} Match Hoodie 2026`,
        price: 94,
        image: brazilHoodieAlbumImages[0],
        gallery: brazilHoodieAlbumImages,
        badge: 'Fan favorite',
        color: team.colors[1],
      }]
    : []),
  ...(team.id === 'france' || team.id === 'brazil'
    ? []
    : [
      {
        id: `${team.id}-slides`,
        teamId: team.id,
        category: 'Sandals',
        name: `${team.name} Crest Slides`,
        price: 39,
        image: rotateGallery(photos.sandals, teamIndex % photos.sandals.length)[0],
        gallery: rotateGallery(photos.sandals, teamIndex % photos.sandals.length),
        color: team.colors[0],
      },
      {
        id: `${team.id}-tattoos`,
        teamId: team.id,
        category: 'Tattoos',
        name: `${team.name} Match Day Tattoos`,
        price: 12,
        image: rotateGallery(photos.tattoos, teamIndex % photos.tattoos.length)[0],
        gallery: [team.logo, ...rotateGallery(photos.tattoos, teamIndex % photos.tattoos.length)],
        badge: teamIndex % 4 === 0 ? 'Fan pack' : null,
        color: team.colors[0],
      },
      {
        id: `${team.id}-shoes`,
        teamId: team.id,
        category: 'Shoes',
        name: `${team.name} Street Trainers`,
        price: 115,
        oldPrice: teamIndex % 2 === 0 ? 135 : null,
        image: rotateGallery(photos.shoes, teamIndex % photos.shoes.length)[0],
        gallery: rotateGallery(photos.shoes, teamIndex % photos.shoes.length),
        badge: teamIndex % 2 === 0 ? 'Limited' : null,
        color: team.colors[0],
      },
    ]),
]);

export const products = [...generatedProducts, ...importedProducts, ...importedTracksuits];
