import CollaborationMap from './collaboration-map';
import Image from 'next/image';
import Link from 'next/link';
import { PublicationCitation, type Publication } from './publication-citation';
import publications from './publications/publications.json';
import VisitorStats from './visitor-stats';

const scholar = 'https://scholar.google.com/citations?user=bRxtRvsAAAAJ&hl=en';

const experience = [
  { date: '1 Sep 2026—present', role: 'Postdoctoral Researcher', place: 'Department of Earth Sciences · Uppsala University', prefix: 'Working with', people: [{ name: 'Gabriele Messori', url: 'https://gmessori.eu/' }] },
  { date: '1 Sep 2024—30 Aug 2026', role: 'Postdoctoral Researcher', place: 'Department of Earth Sciences · University of Gothenburg', prefix: 'Worked with', people: [{ name: 'Deliang Chen', url: 'http://faculty.dess.tsinghua.edu.cn/chendeliang/en/index.htm' }, { name: 'Céline Heuzé', url: 'https://cheuze.com/' }] },
  { date: 'Sep 2020—Jun 2024', role: 'Ph.D. in Atmospheric Science', place: 'Peking University', prefix: 'Physical Oceanography · Advisor', people: [{ name: 'Yongyun Hu', url: 'https://faculty.pku.edu.cn/yyhu/' }] },
  { date: 'Aug 2019—Aug 2020', role: 'Research Assistant', place: 'Institute of Atmospheric Physics · Chinese Academy of Sciences', prefix: 'Worked with', people: [{ name: 'Wen Chen', url: 'http://www.srees.ynu.edu.cn/info/1454/3941.htm' }] },
  { date: 'Sep 2012—Jun 2019', role: 'B.S. & M.S. in Atmospheric Science', place: 'Nanjing University of Information Science & Technology', prefix: 'Advisors', people: [{ name: 'Tim Li' }, { name: 'Ying Sun', url: 'https://graduate.camscma.cn/article/3/67.html' }] },
];

const featuredDois = ['10.1029/2025JD044894', '10.5194/wcd-6-1107-2025', '10.1029/2024PA004886', '10.1029/2025GL115537', '10.1029/2019EF001276'];
const featuredResearch = featuredDois.map((id) => (publications as Publication[]).find((paper) => paper.doi?.includes(id))).filter(Boolean) as Publication[];

const activities = [
  {
    label: 'Editorship',
    items: [
      { date: '2025—present', role: 'Youth Editor', detail: 'The Innovation' },
      { date: '2025—2026', role: 'Guest Editor', detail: 'Climate · Wind-Speed Variability from Tropopause to Surface', url: 'https://www.mdpi.com/journal/climate/special_issues/N9PUU5HAD2' },
      { date: '2025—2026', role: 'Guest Editor', detail: 'Meteorology · Wind-Speed Variability from Tropopause to Surface', url: 'https://www.mdpi.com/journal/meteorology/special_issues/716881L4KW' },
    ],
  },
  {
    label: 'Research projects',
    items: [
      { date: '2026—2027', role: 'Principal Investigator · SEK 50,000', detail: 'Extratropical cyclone clustering and extreme sea level around the North Sea · Helge Ax:son Johnsons Foundation' },
      { date: '2026—2027', role: 'Principal Investigator · SEK 40,000', detail: 'Cyclone clustering and extreme sea level along the Nordic coast · Stiftelsen Lars Hiertas Minne' },
      { date: '2024—2026', role: 'Main participant · Formas', detail: 'Impact of climate variation and change on offshore wind energy potential' },
      { date: '2024—2025', role: 'Main participant · Formas', detail: 'Northern European enclosure dam and protection from sea-level rise' },
      { date: '2020—2024', role: 'Participant · NSFC', detail: 'Continental evolution and monsoon changes' },
      { date: '2017—2021', role: 'Participant · National Key R&D', detail: 'East Asian climate response under 1.5°C global warming' },
    ],
  },
  {
    label: 'Community & outreach',
    items: [
      { date: '2026—present', role: 'Member', detail: 'MERGE · Swedish strategic research area' },
      { date: '2026', role: 'Co-convener · EGU General Assembly', detail: 'Climate and Environmental Monitoring with Near-Surface Wind Variability and Optical Sensors', url: 'https://meetingorganizer.copernicus.org/EGU26/session/56362' },
      { date: '2025', role: 'Major review coauthor · C2B2', detail: 'Baseline report on Sweden’s marine environment, climate and human uses' },
    ],
  },
  {
    label: 'Teaching',
    items: [
      { date: '2026', role: 'Guest Lecturer · University of Gothenburg', detail: 'Climate Modelling · Master’s course · 2 hours' },
      { date: '2021—2022', role: 'Teaching Assistant · Peking University', detail: 'Weather Analysis and Forecast · Bachelor’s and Master’s courses · 48 hours' },
    ],
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Zhi-Bo Li, home">ZB<span>·</span>L</a>
        <nav aria-label="Main navigation">
          <Link href="/" aria-current="page">Home</Link><Link href="/publications">Publications</Link><Link href="/presentations">Presentations</Link>
        </nav>
        <a className="contact-link" href="mailto:zhi-bo.li@gu.se">Let&apos;s talk ↗</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Climate scientist in Sweden</p>
          <h1>Zhi-Bo Li</h1>
          <p className="hero-role">Climate dynamics · Extreme climate · Wind and energy · Paleoclimate</p>
          <p className="intro">I am a climate scientist studying the connections between near-surface winds, sea-level change and extreme weather. I also investigate deep-time paleoclimate, global monsoons, atmospheric teleconnections and aridity using observations and climate-model simulations. International collaboration is always welcome.</p>
          <div className="hero-actions">
            <Link className="button primary" href="/publications">Browse publications <span>↗</span></Link>
            <a className="button quiet" href="/Zhi-Bo-Li-CV.pdf" download>Download full CV (PDF) ↓</a>
          </div>
        </div>
        <div className="hero-profile">
          <figure className="portrait-card"><Image src="/head-enhanced.png" alt="Portrait of Zhi-Bo Li" width={640} height={640} priority /></figure>
          <div className="profile-details">
            <p><span>Current position · from 1 September 2026</span><strong>Postdoctoral Researcher</strong><small>Uppsala University · Department of Earth Sciences</small></p>
          </div>
        </div>
      </section>

      <section className="featured-section" id="publications">
        <div className="featured-bar"><p className="eyebrow"><span /> Featured research</p><Link href="/publications">View all 41 publications ↗</Link></div>
        <ol className="featured-list">
          {featuredResearch.map((paper, index) => <li key={paper.doi}><span>{String(index + 1).padStart(2, '0')}</span><small>{paper.year}</small><p><PublicationCitation text={paper.citation} links={paper.links} /></p><a href={paper.doi ?? '#'} target="_blank" rel="noreferrer" aria-label="Open this featured paper on the journal website">↗</a></li>)}
        </ol>
      </section>

      <section className="network-section" id="network">
        <div className="network-heading">
          <p className="eyebrow"><span /> Academic network</p>
          <h2>Science travels<br />across borders.</h2>
        </div>
        <CollaborationMap />
      </section>

      <section className="experience-section" id="experience">
        <div className="experience-heading"><p className="eyebrow"><span /> Experience</p></div>
        <div className="timeline">
          {experience.map((item) => (
            <article className="timeline-row" key={`${item.date}-${item.role}`}><p>{item.date}</p><div><h3>{item.role}</h3><strong>{item.place}</strong><span className="experience-links">{item.prefix}: {item.people.map((person, index) => <span key={person.name}>{index > 0 ? ' · ' : ''}{person.url ? <a href={person.url} target="_blank" rel="noreferrer">{person.name} ↗</a> : person.name}</span>)}</span></div></article>
          ))}
        </div>
        <aside className="activity-sections" aria-label="Editorship, projects, community and teaching">
          {activities.map((group) => <section className="activity-section" key={group.label}><h3>{group.label}</h3><div className="activity-list">{group.items.map((item) => <article key={`${item.date}-${item.role}-${item.detail}`}><small>{item.date}</small><strong>{item.role}</strong><p>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.detail} ↗</a> : item.detail}</p></article>)}</div></section>)}
        </aside>
      </section>

      <VisitorStats />

      <footer>
        <div><p className="eyebrow"><span /> Contact</p></div>
        <div className="footer-links"><a href="mailto:zhi-bo.li@gu.se">zhi-bo.li@gu.se ↗</a><a href={scholar} target="_blank" rel="noreferrer">Google Scholar ↗</a><a href="https://orcid.org/0000-0001-9135-1583" target="_blank" rel="noreferrer">ORCID ↗</a><a href="https://www.researchgate.net/profile/Zhi-Bo-Li" target="_blank" rel="noreferrer">ResearchGate ↗</a></div>
        <p className="copyright">© 2026 Zhi-Bo Li · Designed for clarity, built for change.</p>
      </footer>
    </main>
  );
}
