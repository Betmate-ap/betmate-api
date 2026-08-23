export interface ExternalMatch {
  externalId: string;
  name: string;
  team1: string;
  team2: string;
  venue: string;
  dateTimeGMT: string;
  matchStarted: boolean;
  matchEnded: boolean;
  status: string;
}

export interface CricketProvider {
  getIPLMatches(): Promise<ExternalMatch[]>;
}
