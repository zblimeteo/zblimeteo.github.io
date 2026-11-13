import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Datasets · Zhi-Bo Li',
  description: 'Open research data by Zhi-Bo Li, including ERA5 cyclone system tracks for 1940–2024.',
  alternates: { canonical: '/datasets.html' },
  openGraph: {
    title: 'Datasets · Zhi-Bo Li',
    description: 'Open research data, including ERA5 cyclone system tracks for 1940–2024.',
    url: '/datasets.html',
    images: [],
  },
};

export default function DatasetsPage() {
  return (
    <main className="datasets-page">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="Zhi-Bo Li, home">ZB<span>·</span>L</a>
        <nav aria-label="Main navigation"><a href="/">Home</a><a href="/publications.html">Publications</a><a href="/presentations.html">Presentations</a><a href="/datasets.html" aria-current="page">Datasets</a></nav>
        <a className="contact-link" href="mailto:zhi-bo.li@geo.uu.se">Let&apos;s talk ↗</a>
      </header>

      <section className="datasets-content" aria-labelledby="datasets-title">
        <h1 className="section-title" id="datasets-title">Datasets</h1>
        <article className="dataset-record">
          <h2>ERA5 Northern Hemisphere Extratropical and Arctic Cyclone System Tracks, 1940–2024</h2>
          <p className="dataset-details">Version 1.0.0 · 1,020 monthly CSV files · CC BY 4.0</p>
          <p>ERA5-derived cyclone system tracks at 6-hourly UTC times, with cyclone-center coordinates, sea-level pressure, size and motion diagnostics, and track and event identifiers. The archive supports the analysis of all-season cyclone activity over the Arctic Ocean, North Atlantic and North Pacific. The Zenodo record includes a README with field definitions and guidance on reading tracks that span month boundaries.</p>
          <div className="publication-highlights">
            <a href="https://doi.org/10.5281/zenodo.24207510" target="_blank" rel="noreferrer">Dataset on Zenodo ↗</a>
            <a href="https://doi.org/10.1029/2025JD044894" target="_blank" rel="noreferrer">JGR: Atmospheres article ↗</a>
          </div>
        </article>
      </section>

      <footer className="publication-footer"><a href="/">← Back to homepage</a><span>© 2026 Zhi-Bo Li</span></footer>
    </main>
  );
}
