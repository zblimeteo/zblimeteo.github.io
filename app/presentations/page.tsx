import type { Metadata } from 'next';
import presentations from './presentations.json';

export const dynamic = 'force-static';

type Presentation = { date: string; location: string; event: string; title: string; type: string };

export const metadata: Metadata = {
  title: 'Scientific Presentations · Zhi-Bo Li',
  description: 'Scientific conference talks, invited presentations and posters by climate scientist Zhi-Bo Li.',
  alternates: { canonical: '/presentations.html' },
  openGraph: { title: 'Scientific Presentations · Zhi-Bo Li', description: 'Conference talks, invited presentations and posters.', url: '/presentations.html', images: [] },
  twitter: { card: 'summary', title: 'Scientific Presentations · Zhi-Bo Li', description: 'Conference talks, invited presentations and posters.', images: [] },
};

export default function PresentationsPage() {
  const records = presentations as Presentation[];

  return (
    <main className="presentations-page">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="Zhi-Bo Li, home">ZB<span>·</span>L</a>
        <nav aria-label="Main navigation"><a href="/">Home</a><a href="/publications.html">Publications</a><a href="/presentations.html" aria-current="page">Presentations</a></nav>
        <a className="contact-link" href="mailto:zhi-bo.li@geo.uu.se">Let&apos;s talk ↗</a>
      </header>

      <section className="presentation-table-wrap" aria-label="Scientific presentations">
        <h1 className="sr-only">Scientific presentations</h1>
        <table className="presentation-table">
          <caption className="sr-only">Scientific talks and posters, most recent first</caption>
          <colgroup><col className="presentation-col-date" /><col className="presentation-col-title" /><col className="presentation-col-event" /><col className="presentation-col-location" /><col className="presentation-col-type" /></colgroup>
          <thead><tr><th scope="col">Date</th><th scope="col">Presentation</th><th scope="col">Event</th><th scope="col">Location</th><th scope="col">Type</th></tr></thead>
          <tbody>{records.map((record, index) => <tr key={`${record.date}-${record.event}-${index}`}>
            <td data-label="Date"><time>{record.date}</time></td>
            <td data-label="Presentation">{record.title}</td>
            <td data-label="Event">{record.event}</td>
            <td data-label="Location">{record.location}</td>
            <td data-label="Type">{record.type}</td>
          </tr>)}</tbody>
        </table>
      </section>

      <footer className="publication-footer"><a href="/">← Back to homepage</a><span>© 2026 Zhi-Bo Li</span></footer>
    </main>
  );
}
