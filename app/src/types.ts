export interface Config {
  immichServer: string;
  schedule: string;
  users: User[]
}

export interface User {
  apiKey: string;
  personLinks: Link[]
}

export interface Link {
  description?: string;
  personId?: string;  // Single person (original behavior)
  personIds?: string[];  // Multiple persons
  operation?: 'OR' | 'AND';  // Operation type (defaults to OR for backward compatibility)
  excludePersonIds?: string[];  // NOT operation
  excludeOthers?: boolean;  // New: Exclude all other people not in personIds
  albumId: string;
  apiKeyShort: string;
}