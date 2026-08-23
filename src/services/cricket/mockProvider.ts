import type { CricketProvider, ExternalMatch } from "./types";

function dt(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

// Six scenarios — one of each state the sync service must handle.
// Dates for upcoming matches are recomputed on every call so they stay
// in the future regardless of when the server started.
// Dates for started/ended matches are fixed offsets in the past.
const SCENARIOS: Array<
  Omit<ExternalMatch, "dateTimeGMT"> & { hoursOffset: number }
> = [
  {
    // Scenario A: upcoming, well within the challenge window (5h away)
    externalId: "mock-upcoming-mi-csk",
    name: "Mumbai Indians vs Chennai Super Kings, 1st Match",
    team1: "Mumbai Indians",
    team2: "Chennai Super Kings",
    venue: "Wankhede Stadium, Mumbai",
    hoursOffset: 5,
    matchStarted: false,
    matchEnded: false,
    status: "Match not started",
  },
  {
    // Scenario B: upcoming, tomorrow (tests second upsert is a no-op)
    externalId: "mock-upcoming-rcb-kkr",
    name: "Royal Challengers Bengaluru vs Kolkata Knight Riders, 2nd Match",
    team1: "Royal Challengers Bengaluru",
    team2: "Kolkata Knight Riders",
    venue: "M Chinnaswamy Stadium, Bengaluru",
    hoursOffset: 26,
    matchStarted: false,
    matchEnded: false,
    status: "Match not started",
  },
  {
    // Scenario C: live — status should flip to LIVE in our DB
    externalId: "mock-live-srh-rr",
    name: "Sunrisers Hyderabad vs Rajasthan Royals, 3rd Match",
    team1: "Sunrisers Hyderabad",
    team2: "Rajasthan Royals",
    venue: "Rajiv Gandhi International Cricket Stadium, Hyderabad",
    hoursOffset: -1,
    matchStarted: true,
    matchEnded: false,
    status: "Rajasthan Royals need 45 runs in 30 balls",
  },
  {
    // Scenario D: completed, team1 wins — resolveMatch("Gujarat Titans")
    externalId: "mock-completed-gt-lsg-team1-wins",
    name: "Gujarat Titans vs Lucknow Super Giants, 4th Match",
    team1: "Gujarat Titans",
    team2: "Lucknow Super Giants",
    venue: "Narendra Modi Stadium, Ahmedabad",
    hoursOffset: -5,
    matchStarted: true,
    matchEnded: true,
    status: "Gujarat Titans won by 5 wickets",
  },
  {
    // Scenario E: completed, team2 wins — resolveMatch("Punjab Kings")
    externalId: "mock-completed-dc-pbks-team2-wins",
    name: "Delhi Capitals vs Punjab Kings, 5th Match",
    team1: "Delhi Capitals",
    team2: "Punjab Kings",
    venue: "Arun Jaitley Stadium, Delhi",
    hoursOffset: -6,
    matchStarted: true,
    matchEnded: true,
    status: "Punjab Kings won by 20 runs",
  },
  {
    // Scenario F: abandoned/no result — resolveMatch(null) → CANCELLED
    externalId: "mock-abandoned-mi-rcb",
    name: "Mumbai Indians vs Royal Challengers Bengaluru, 6th Match",
    team1: "Mumbai Indians",
    team2: "Royal Challengers Bengaluru",
    venue: "Wankhede Stadium, Mumbai",
    hoursOffset: -8,
    matchStarted: true,
    matchEnded: true,
    status: "Match abandoned due to rain",
  },
];

export class MockCricketProvider implements CricketProvider {
  async getIPLMatches(): Promise<ExternalMatch[]> {
    return SCENARIOS.map(({ hoursOffset, ...rest }) => ({
      ...rest,
      dateTimeGMT: dt(hoursOffset),
    }));
  }
}
