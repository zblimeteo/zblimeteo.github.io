import type { Metadata } from 'next';
import Script from 'next/script';
import { doiIdentifier, PublicationLines, PublicationHighlights, type Publication } from '../publication-citation';
import publications from './publications.json';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Publications · Zhi-Bo Li',
  description: 'Complete peer-reviewed publication record of climate scientist Zhi-Bo Li.',
  alternates: { canonical: '/publications.html' },
  openGraph: {
    title: 'Publications · Zhi-Bo Li',
    description: 'Complete peer-reviewed publication record in climate dynamics, extremes, wind and paleoclimate.',
    url: '/publications.html',
    images: [],
  },
  twitter: { card: 'summary', title: 'Publications · Zhi-Bo Li', description: 'Complete peer-reviewed publication record.', images: [] },
};

export default function PublicationsPage() {
  const records = publications as Publication[];
  const leading = records.filter(paper => paper.firstAuthor || paper.correspondingAuthor).length;
  const years = [...new Set(records.map((publication) => publication.year))];

  return (
    <main className="publications-page">
      <header className="site-header publications-header">
        <a className="wordmark" href="/" aria-label="Zhi-Bo Li, home">ZB<span>·</span>L</a>
        <nav aria-label="Main navigation"><a href="/">Home</a><a href="/publications.html" aria-current="page">Publications</a><a href="/presentations.html">Presentations</a></nav>
        <a className="contact-link" href="mailto:zhi-bo.li@gu.se">Let&apos;s talk ↗</a>
      </header>

      <section className="publication-page-hero" aria-label="Publication overview">
        <h1 className="sr-only">Publications</h1>
        <div className="publication-overview">
          <div className="publication-totals"><p><strong>{records.length}</strong><span>Peer-reviewed papers</span></p><p><strong>{leading}</strong><span>Leading author papers<small>First or corresponding author</small></span></p></div>
          <p>Climate dynamics · Extreme climate · Wind speed · Renewable energy · Paleoclimate · Monsoon</p>
        </div>
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
                    <PublicationLines paper={publication} />
                    <div className="publication-actions">
                      <PublicationHighlights paper={publication} />
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

      <footer className="publication-footer"><a href="/">← Back to homepage</a><span>© 2026 Zhi-Bo Li</span></footer>
      <Script src="https://embed.altmetric.com/assets/embed.js" strategy="afterInteractive" />
    </main>
  );
}
