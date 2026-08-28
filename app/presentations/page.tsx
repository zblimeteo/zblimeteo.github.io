import type { Metadata } from 'next';
import Link from 'next/link';
import presentations from './presentations.json';

type Presentation = { date: string; location: string; event: string; title: string; type: string };

export const metadata: Metadata = {
  title: 'Scientific Presentations · Zhi-Bo Li',
  description: 'Scientific conference talks, invited presentations and posters by climate scientist Zhi-Bo Li.',
  openGraph: { title: 'Scientific Presentations · Zhi-Bo Li', description: 'Conference talks, invited presentations and posters.', images: [] },
  twitter: { card: 'summary', title: 'Scientific Presentations · Zhi-Bo Li', description: 'Conference talks, invited presentations and posters.', images: [] },
};

export default function PresentationsPage() {
  const records = presentations as Presentation[];
  const years = [...new Set(records.map((record) => record.date.slice(0, 4)))];

  return (
    <main className="presentations-page">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Zhi-Bo Li, home">ZB<span>·</span>L</Link>
        <nav aria-label="Main navigation"><Link href="/">Home</Link><Link href="/publications">Publications</Link><Link href="/presentations" aria-current="page">Presentations</Link></nav>
        <a className="contact-link" href="mailto:zhi-bo.li@gu.se">Let&apos;s talk ↗</a>
      </header>

      <section className="presentation-page-intro">
        <p className="eyebrow"><span /> Scientific presentations</p>
        <h1>Scientific presentations</h1>
        <p>Invited talks, oral presentations and posters at conferences, workshops and university seminars.</p>
      </section>

      <div className="presentation-simple-list">
        {years.map((year) => {
          const group = records.filter((record) => record.date.startsWith(year));
          return (
            <section className="presentation-simple-year" key={year}>
              <h2>{year}</h2>
              <ol>
                {group.map((record, index) => (
                  <li className="presentation-simple-record" key={`${record.date}-${record.event}-${index}`}>
                    <span className="presentation-number">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="presentation-date"><time>{record.date}</time> · {record.location} · {record.type}</p>
                      <h3>{record.title}</h3>
                      <p className="presentation-event">{record.event}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <footer className="publication-footer"><Link href="/">← Back to homepage</Link><span>© 2026 Zhi-Bo Li</span></footer>
    </main>
  );
}
