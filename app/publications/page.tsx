import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { doiIdentifier, PublicationCitation, type Publication } from '../publication-citation';
import publications from './publications.json';

export const metadata: Metadata = {
  title: 'Publications · Zhi-Bo Li',
  description: 'Complete peer-reviewed publication record of climate scientist Zhi-Bo Li.',
  openGraph: {
    title: 'Publications · Zhi-Bo Li',
    description: 'Complete peer-reviewed publication record in climate dynamics, extremes, wind and paleoclimate.',
    images: [],
  },
  twitter: { card: 'summary', title: 'Publications · Zhi-Bo Li', description: 'Complete peer-reviewed publication record.', images: [] },
};

export default function PublicationsPage() {
  const records = publications as Publication[];
  const years = [...new Set(records.map((publication) => publication.year))];

  return (
    <main className="publications-page">
      <header className="site-header publications-header">
        <Link className="wordmark" href="/" aria-label="Zhi-Bo Li, home">ZB<span>·</span>L</Link>
        <nav aria-label="Main navigation"><Link href="/">Home</Link><Link href="/publications" aria-current="page">Publications</Link><Link href="/presentations">Presentations</Link></nav>
        <a className="contact-link" href="mailto:zhi-bo.li@gu.se">Let&apos;s talk ↗</a>
      </header>

      <section className="publication-page-hero">
        <div><p className="eyebrow"><span /> Complete record</p><h1>Publications.</h1></div>
        <div className="publication-overview"><strong>{records.length}</strong><span>Peer-reviewed papers</span><p>Climate dynamics · Extreme climate · Wind speed · Renewable energy · Paleoclimate · Monsoon</p></div>
      </section>

      <section className="publication-key">
        <p><strong>*</strong> Corresponding author</p><p><strong>Bold</strong> Zhi-Bo Li</p><p><span className="student-key">Underline</span> Supervised student</p><p><span className="mini-altmetric"><i>90</i></span> Live Altmetric score</p>
        <a href="https://scholar.google.com/citations?user=bRxtRvsAAAAJ&hl=en" target="_blank" rel="noreferrer">Google Scholar ↗</a>
      </section>

      <div className="complete-publication-list">
        {years.map((year) => {
          const group = records.filter((publication) => publication.year === year);
          return (
            <section className="publication-year" key={year}>
              <div className="year-marker"><h2>{year}</h2><span>{group.length} papers</span></div>
              <ol>
                {group.map((publication, index) => (
                  <li className="publication-record" key={`${publication.doi}-${index}`}>
                    <span className="publication-number">{String(index + 1).padStart(2, '0')}</span>
                    <p><PublicationCitation text={publication.citation} links={publication.links} /></p>
                    <div className="publication-actions">
                      {publication.doi ? <a className="journal-link" href={publication.doi} target="_blank" rel="noreferrer" aria-label="Open this article on the journal website" title="Open on the journal website"><span className="link-glyph" aria-hidden="true" /></a> : null}
                      {publication.doi ? <div
                        className="altmetric-embed"
                        data-badge-type="donut"
                        data-badge-popover="left"
                        data-hide-no-mentions="true"
                        data-doi={doiIdentifier(publication.doi)}
                        aria-label="Live Altmetric Attention Score"
                      /> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <footer className="publication-footer"><Link href="/">← Back to homepage</Link><span>© 2026 Zhi-Bo Li</span></footer>
      <Script src="https://embed.altmetric.com/assets/embed.js" strategy="afterInteractive" />
    </main>
  );
}
