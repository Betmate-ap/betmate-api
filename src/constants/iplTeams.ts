// Logos are NOT provided by CricAPI — host your own assets and fill in logoUrl.
// The name field must match exactly what CricAPI returns in the teams[] array.
export interface IPLTeam {
  name: string;
  abbreviation: string;
  homeGround: string;
  logoUrl: string | null;
}

export const IPL_TEAMS: IPLTeam[] = [
  {
    name: "Mumbai Indians",
    abbreviation: "MI",
    homeGround: "Wankhede Stadium, Mumbai",
    logoUrl: null,
  },
  {
    name: "Chennai Super Kings",
    abbreviation: "CSK",
    homeGround: "MA Chidambaram Stadium, Chennai",
    logoUrl: null,
  },
  {
    name: "Royal Challengers Bengaluru",
    abbreviation: "RCB",
    homeGround: "M Chinnaswamy Stadium, Bengaluru",
    logoUrl: null,
  },
  {
    name: "Kolkata Knight Riders",
    abbreviation: "KKR",
    homeGround: "Eden Gardens, Kolkata",
    logoUrl: null,
  },
  {
    name: "Delhi Capitals",
    abbreviation: "DC",
    homeGround: "Arun Jaitley Stadium, Delhi",
    logoUrl: null,
  },
  {
    name: "Punjab Kings",
    abbreviation: "PBKS",
    homeGround: "Punjab Cricket Association Stadium, Mohali",
    logoUrl: null,
  },
  {
    name: "Rajasthan Royals",
    abbreviation: "RR",
    homeGround: "Sawai Mansingh Stadium, Jaipur",
    logoUrl: null,
  },
  {
    name: "Sunrisers Hyderabad",
    abbreviation: "SRH",
    homeGround: "Rajiv Gandhi International Cricket Stadium, Hyderabad",
    logoUrl: null,
  },
  {
    name: "Gujarat Titans",
    abbreviation: "GT",
    homeGround: "Narendra Modi Stadium, Ahmedabad",
    logoUrl: null,
  },
  {
    name: "Lucknow Super Giants",
    abbreviation: "LSG",
    homeGround: "BRSABV Ekana Cricket Stadium, Lucknow",
    logoUrl: null,
  },
];

export const IPL_TEAM_BY_NAME = new Map<string, IPLTeam>(
  IPL_TEAMS.map((t) => [t.name.toLowerCase(), t]),
);

export function getTeamAbbreviation(name: string): string {
  return IPL_TEAM_BY_NAME.get(name.toLowerCase())?.abbreviation ?? name;
}
