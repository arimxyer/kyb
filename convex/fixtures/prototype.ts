/**
 * Seed-only fixture for the NY-04 prototype.
 *
 * Runtime application code must read through Convex functions instead of
 * importing this module.
 */
export type EvidenceStatus =
  | "verified"
  | "candidate-statement"
  | "partisan-source"
  | "needs-review"
  | "not-found";

export type Source = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  sourceType: "government" | "campaign" | "party";
  checkedAt: string;
};

export type EvidenceItem = {
  title: string;
  detail: string;
  sourceId: string | null;
  status: EvidenceStatus;
};

export type AgendaItem = {
  topic: string;
  position: string;
  sourceId: string | null;
  status: EvidenceStatus;
};

export type Candidate = {
  slug: string;
  name: string;
  initials: string;
  party: string;
  ballotLines: string[];
  role: string;
  incumbent: boolean;
  summary: string;
  fecId: string | null;
  coverage: {
    profile: number;
    agenda: number;
    record: number;
    funding: number;
  };
  agenda: AgendaItem[];
  record: EvidenceItem[];
  support: EvidenceItem[];
  statementsVsActions: EvidenceItem[];
  finance: {
    raised: number | null;
    spent: number | null;
    cashOnHand: number | null;
    coverage: string;
    sourceId: string | null;
  };
};

export const sources: Source[] = [
  {
    id: "nassau-candidate-list",
    title: "2026 General Election Candidate List",
    publisher: "Nassau County Board of Elections",
    url: "https://www.nassaucountyny.gov/DocumentCenter/View/53647/2026-Candidate-List-",
    sourceType: "government",
    checkedAt: "July 23, 2026",
  },
  {
    id: "nassau-election",
    title: "General Election Information",
    publisher: "Nassau County Board of Elections",
    url: "https://www.nassaucountyny.gov/566/Board-of-Elections",
    sourceType: "government",
    checkedAt: "July 23, 2026",
  },
  {
    id: "nys-election",
    title: "2026 General Election Calendar",
    publisher: "New York State Board of Elections",
    url: "https://elections.ny.gov/",
    sourceType: "government",
    checkedAt: "July 23, 2026",
  },
  {
    id: "gillen-house-about",
    title: "About Representative Laura Gillen",
    publisher: "U.S. House of Representatives",
    url: "https://gillen.house.gov/about",
    sourceType: "government",
    checkedAt: "July 23, 2026",
  },
  {
    id: "gillen-house-costs",
    title: "Lowering Costs",
    publisher: "Office of Representative Laura Gillen",
    url: "https://gillen.house.gov/lowercosts",
    sourceType: "government",
    checkedAt: "July 23, 2026",
  },
  {
    id: "gillen-fec",
    title: "Laura Gillen — Candidate Overview",
    publisher: "Federal Election Commission",
    url: "https://www.fec.gov/data/candidate/H2NY04244/",
    sourceType: "government",
    checkedAt: "July 23, 2026",
  },
  {
    id: "driscoll-fec",
    title: "Jeanine Driscoll — Candidate Overview",
    publisher: "Federal Election Commission",
    url: "https://www.fec.gov/data/candidate/H6NY04211/",
    sourceType: "government",
    checkedAt: "July 23, 2026",
  },
  {
    id: "driscoll-campaign",
    title: "Standing Up for Long Island",
    publisher: "Jeanine Driscoll for Congress",
    url: "https://driscoll4congress.com/",
    sourceType: "campaign",
    checkedAt: "July 23, 2026",
  },
  {
    id: "gillen-endorsement",
    title: "Congressional Black Caucus PAC Endorsement",
    publisher: "Laura Gillen for Congress",
    url: "https://lauragillen.com/2026/03/13/rep-laura-gillen-announces-congressional-black-caucus-pac-endorsement-in-re-election-campaign/",
    sourceType: "campaign",
    checkedAt: "July 23, 2026",
  },
  {
    id: "driscoll-nrcc",
    title: "MAGA Majority Program Announcement",
    publisher: "National Republican Congressional Committee",
    url: "https://www.nrcc.org/2026/07/15/nrcc-announces-jeanine-driscoll-to-maga-majority-program/",
    sourceType: "party",
    checkedAt: "July 23, 2026",
  },
  {
    id: "tarnoff-lpny",
    title: "Nassau County Committee",
    publisher: "Libertarian Party of New York",
    url: "https://lpny.org/affiliates/nassau/",
    sourceType: "party",
    checkedAt: "July 23, 2026",
  },
];

export const candidates: Candidate[] = [
  {
    slug: "laura-gillen",
    name: "Laura A. Gillen",
    initials: "LG",
    party: "Democratic",
    ballotLines: ["DEM"],
    role: "U.S. Representative, New York’s 4th District",
    incumbent: true,
    summary:
      "A first-term member of Congress and former Hempstead Town Supervisor. Her official materials emphasize affordability, public safety, and bipartisan work.",
    fecId: "H2NY04244",
    coverage: { profile: 100, agenda: 78, record: 82, funding: 100 },
    agenda: [
      {
        topic: "Cost of living",
        position:
          "Says lowering the cost of groceries, utilities, health care, and other essentials is a central focus, with an emphasis on bipartisan solutions.",
        sourceId: "gillen-house-costs",
        status: "candidate-statement",
      },
      {
        topic: "Infrastructure",
        position:
          "Her committee assignments include highways and transit, aviation, and water resources and environment.",
        sourceId: "gillen-house-about",
        status: "verified",
      },
      {
        topic: "Public safety",
        position:
          "Official materials list law enforcement as an issue area; the pilot has not yet normalized a full candidate platform for side-by-side comparison.",
        sourceId: "gillen-house-about",
        status: "needs-review",
      },
    ],
    record: [
      {
        title: "Current federal office",
        detail:
          "Serving a first term representing New York’s 4th Congressional District.",
        sourceId: "gillen-house-about",
        status: "verified",
      },
      {
        title: "Prior public office",
        detail:
          "Elected Hempstead Town Supervisor in 2017, according to her official House biography.",
        sourceId: "gillen-house-about",
        status: "verified",
      },
      {
        title: "Committee work",
        detail:
          "Serves on House Transportation and Infrastructure and House Science, Space, and Technology.",
        sourceId: "gillen-house-about",
        status: "verified",
      },
    ],
    support: [
      {
        title: "Congressional Black Caucus PAC",
        detail:
          "The Gillen campaign announced the endorsement in March 2026. This is a campaign source and should be read as such.",
        sourceId: "gillen-endorsement",
        status: "candidate-statement",
      },
    ],
    statementsVsActions: [
      {
        title: "Lowering costs",
        detail:
          "A public statement has been captured. A complete reconciliation against bill sponsorship and roll-call votes is still in review; no consistency judgment is shown yet.",
        sourceId: "gillen-house-costs",
        status: "needs-review",
      },
    ],
    finance: {
      raised: 5097222.15,
      spent: 1276601.72,
      cashOnHand: 3843823.75,
      coverage: "January 1, 2025 – June 30, 2026",
      sourceId: "gillen-fec",
    },
  },
  {
    slug: "jeanine-driscoll",
    name: "Jeanine C. Driscoll",
    initials: "JD",
    party: "Republican",
    ballotLines: ["REP", "CON"],
    role: "Hempstead Town Receiver of Taxes",
    incumbent: false,
    summary:
      "An attorney and local officeholder challenging for Congress. Her campaign emphasizes tax relief, law enforcement, and border security.",
    fecId: "H6NY04211",
    coverage: { profile: 88, agenda: 76, record: 52, funding: 100 },
    agenda: [
      {
        topic: "Taxes and SALT",
        position:
          "Her campaign says she would seek to restore the full state and local tax deduction and provide additional relief for Nassau County families and seniors.",
        sourceId: "driscoll-campaign",
        status: "candidate-statement",
      },
      {
        topic: "Public safety",
        position: "Her campaign says she will support law enforcement.",
        sourceId: "driscoll-campaign",
        status: "candidate-statement",
      },
      {
        topic: "Border security",
        position:
          "Her campaign says she will prioritize preventing the southern border from being reopened.",
        sourceId: "driscoll-campaign",
        status: "candidate-statement",
      },
    ],
    record: [
      {
        title: "Current local office",
        detail:
          "Campaign and party materials identify Driscoll as Hempstead Town Receiver of Taxes.",
        sourceId: "driscoll-campaign",
        status: "candidate-statement",
      },
      {
        title: "Public-service claims",
        detail:
          "Her campaign says she helped homeowners use exemptions and reduce assessments. The pilot has not independently audited the claimed savings.",
        sourceId: "driscoll-campaign",
        status: "needs-review",
      },
    ],
    support: [
      {
        title: "NRCC MAGA Majority program",
        detail:
          "The National Republican Congressional Committee added Driscoll to its candidate-support program in July 2026.",
        sourceId: "driscoll-nrcc",
        status: "partisan-source",
      },
    ],
    statementsVsActions: [
      {
        title: "Tax relief",
        detail:
          "Campaign positions are captured. A comparable record review of actions taken as Receiver of Taxes is not yet complete.",
        sourceId: "driscoll-campaign",
        status: "needs-review",
      },
    ],
    finance: {
      raised: 264824.04,
      spent: 38549.98,
      cashOnHand: 226274.06,
      coverage: "April 1, 2026 – June 30, 2026",
      sourceId: "driscoll-fec",
    },
  },
  {
    slug: "blay-tarnoff",
    name: "Blay Tarnoff",
    initials: "BT",
    party: "Libertarian",
    ballotLines: ["LIBERTARIAN"],
    role: "Candidate for U.S. House",
    incumbent: false,
    summary:
      "Listed by Nassau County on the Libertarian ballot line. The pilot found limited candidate-specific primary-source material and shows those gaps explicitly.",
    fecId: null,
    coverage: { profile: 58, agenda: 15, record: 44, funding: 0 },
    agenda: [
      {
        topic: "Candidate platform",
        position:
          "No candidate-specific 2026 platform was captured from a primary source in this pilot review.",
        sourceId: null,
        status: "not-found",
      },
    ],
    record: [
      {
        title: "Party role",
        detail:
          "The Libertarian Party of New York lists Tarnoff as chair of its Nassau County Committee.",
        sourceId: "tarnoff-lpny",
        status: "partisan-source",
      },
    ],
    support: [
      {
        title: "Ballot line",
        detail:
          "Nassau County’s candidate list places Tarnoff on the Libertarian line.",
        sourceId: "nassau-candidate-list",
        status: "verified",
      },
    ],
    statementsVsActions: [
      {
        title: "Evidence gap",
        detail:
          "The pilot does not yet have enough candidate-specific statements to run a statements-versus-actions comparison.",
        sourceId: null,
        status: "not-found",
      },
    ],
    finance: {
      raised: null,
      spent: null,
      cashOnHand: null,
      coverage: "No FEC finance snapshot captured in this pilot dataset",
      sourceId: null,
    },
  },
];

export const election = {
  name: "2026 General Election",
  date: "November 3, 2026",
  earlyVoting: "October 24 – November 1",
  district: "New York’s 4th Congressional District",
  districtCode: "NY-04",
  county: "Nassau County",
  pilotZip: "11557",
  ballotUpdatedAt: "July 23, 2026",
  candidateSourceId: "nassau-candidate-list",
};

export function getCandidate(slug: string) {
  return candidates.find((candidate) => candidate.slug === slug);
}

export function getSource(sourceId: string | null) {
  if (!sourceId) return null;
  return sources.find((source) => source.id === sourceId) ?? null;
}

export function formatCurrency(value: number | null) {
  if (value === null) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
