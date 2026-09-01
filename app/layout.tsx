import type { Metadata } from 'next';
import './globals.css';

const siteUrl = 'https://zblimeteo.github.io';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Zhi-Bo Li | Climate Scientist at Uppsala University',
  description: 'Academic website of Zhi-Bo Li, a climate scientist at Uppsala University studying wind, extreme weather, hydroclimate, atmospheric teleconnections and paleoclimate.',
  authors: [{ name: 'Zhi-Bo Li', url: siteUrl }],
  creator: 'Zhi-Bo Li',
  verification: { google: '-LnQY7Kn3NO-mwE27VBnIQh3SVFgZlCZQ2gvIIqmZHA' },
  keywords: ['Zhi-Bo Li', 'Zhibo Li', 'climate scientist', 'Uppsala University', 'climate dynamics', 'extreme climate', 'wind energy', 'hydroclimate', 'paleoclimate'],
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    title: 'Zhi-Bo Li | Climate Scientist at Uppsala University',
    description: 'Research in climate dynamics, extreme weather, wind, hydroclimate and paleoclimate.',
    type: 'website',
    url: '/',
    siteName: 'Zhi-Bo Li — Academic Website',
    locale: 'en_US',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Zhi-Bo Li — Climate across time and scale' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zhi-Bo Li | Climate Scientist at Uppsala University',
    description: 'Research in climate dynamics, extreme weather, wind, hydroclimate and paleoclimate.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        name: 'Zhi-Bo Li',
        alternateName: ['Zhi Bo Li', 'Zhibo Li'],
        url: siteUrl,
        image: `${siteUrl}/prague-portrait.jpg`,
        jobTitle: 'Postdoctoral Researcher',
        worksFor: {
          '@type': 'CollegeOrUniversity',
          name: 'Uppsala University',
          url: 'https://www.uu.se/en',
        },
        sameAs: [
          'https://scholar.google.com/citations?user=bRxtRvsAAAAJ&hl=en',
          'https://orcid.org/0000-0001-9135-1583',
          'https://www.researchgate.net/profile/Zhi-Bo-Li',
          'https://www.gu.se/en/about/find-staff/zhi-boli',
        ],
        knowsAbout: ['Climate dynamics', 'Extreme weather', 'Wind energy', 'Hydroclimate', 'Atmospheric teleconnections', 'Paleoclimate'],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Zhi-Bo Li — Academic Website',
        inLanguage: 'en',
        author: { '@id': `${siteUrl}/#person` },
      },
    ],
  };

  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
      </body>
    </html>
  );
}
