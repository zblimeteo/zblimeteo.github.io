import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zhi-Bo Li · Climate Scientist',
  description: 'Zhi-Bo Li is a climatologist studying wind, hydroclimate, atmospheric teleconnections and deep-time climate.',
  openGraph: {
    title: 'Zhi-Bo Li · Climate Scientist',
    description: 'Climate across time and scale — winds, extremes and paleoclimate.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Zhi-Bo Li — Climate across time and scale' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zhi-Bo Li · Climate Scientist',
    description: 'Climate across time and scale — winds, extremes and paleoclimate.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
