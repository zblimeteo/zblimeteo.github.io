export type MediaLink = { label: string; url: string };
export type Publication = { year: string; citation: string; doi: string | null; altmetric?: number; links?: MediaLink[]; authors: string; title: string; journal: string; details: string; annotations: string[]; firstAuthor: boolean; correspondingAuthor: boolean };

const supervisedStudents = [
  'You Wu',
  'Yu-Xin Yang',
  'Qi-Meng Wu',
  'Jia-Ning Song',
  'Zi-Han Wang',
  'Yang Xu',
  'Hui-Shuang Yuan',
  'Huishuang Yuan',
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findJournal(citation: string) {
  const matches = [...citation.matchAll(/\. ([^.]+?)(?=,\s*\d)/g)];
  return matches.at(-1)?.[1] ?? '';
}

export function doiIdentifier(doi: string) {
  return doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');
}

export function PublicationCitation({ text, links = [] }: { text: string; links?: MediaLink[] }) {
  const journal = findJournal(text);
  const students = supervisedStudents.filter((name) => text.includes(name));
  const terms = [journal, 'Zhi-Bo Li', ...students, ...links.map((link) => link.label)].filter(Boolean).sort((a, b) => b.length - a.length);
  const pieces = terms.length ? text.split(new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'g')) : [text];
  const linkUsage = new Map<string, number>();

  return <>{pieces.map((piece, index) => {
    if (piece === 'Zhi-Bo Li') return <strong key={`${piece}-${index}`}>{piece}</strong>;
    if (piece === journal) return <b className="journal-name" key={`${piece}-${index}`}>{piece}</b>;
    if (students.includes(piece)) return <span className="supervised-student" key={`${piece}-${index}`}>{piece}</span>;
    const matchingLinks = links.filter((link) => link.label === piece);
    const occurrence = linkUsage.get(piece) ?? 0;
    const media = matchingLinks[occurrence] ?? matchingLinks.at(-1);
    if (media) {
      linkUsage.set(piece, occurrence + 1);
      return <a className="media-inline" href={media.url} target="_blank" rel="noreferrer" key={`${piece}-${index}`}>{piece} ↗</a>;
    }
    return <span key={`${piece.slice(0, 12)}-${index}`}>{piece}</span>;
  })}</>;
}

export function PublicationLines({ paper }: { paper: Publication }) {
  return <div className="publication-lines">
    <p className="publication-authors"><PublicationCitation text={paper.authors} /></p>
    <p className="publication-title">{paper.title}</p>
    <p className="publication-journal"><b className="journal-name">{paper.journal}</b>, {paper.details}</p>
    {paper.annotations.length ? <p className="publication-annotations">{paper.annotations.map(note => <span key={note}>{note}</span>)}</p> : null}
  </div>;
}

export function PublicationHighlights({ paper }: { paper: Publication }) {
  return <div className="publication-highlights">{paper.links?.map((link,index) => <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div>;
}
