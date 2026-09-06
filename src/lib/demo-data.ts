import type { Group } from "@/types/domain";

export const demoGroups: Group[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Spartans",
    timezone: "Africa/Lagos",
    defaultSessionFormat: "fixed_teams",
    visibility: "private",
    shareToken: "9b25a5cd-7f75-465b-8432-0d0285f0b611",
    schedules: [{ id: "sch-1", dayOfWeek: 2, kickoffTime: "18:00", venue: "Lekki Astro", active: true }],
    players: [
      { id: "p-davidson", name: "Davidson", active: true }, { id: "p-mike", name: "Mike", active: true },
      { id: "p-tunde", name: "Tunde", active: true }, { id: "p-john", name: "John", active: true },
      { id: "p-sean", name: "Sean", active: true }, { id: "p-tobi", name: "Tobi", active: true },
    ],
    sessions: [{
      id: "s-1", clientSessionId: "c-1", kickoffAt: "2026-09-01T17:00:00.000Z", format: "fixed_teams",
      teams: [{ id: "red", label: "Red", setWins: 1 }, { id: "black", label: "Black", setWins: 0 }],
      appearances: [
        { playerId: "p-davidson", playerName: "Davidson", teamId: "red", goals: 7, assists: 4 },
        { playerId: "p-mike", playerName: "Mike", teamId: "black", goals: 4, assists: 1 },
        { playerId: "p-tunde", playerName: "Tunde", teamId: "black", goals: 3, assists: 3 },
        { playerId: "p-john", playerName: "John", teamId: "red", goals: 2, assists: 1 },
        { playerId: "p-sean", playerName: "Sean", teamId: "red", goals: 1, assists: 2 },
      ],
    }],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Friday Ballers",
    timezone: "Africa/Lagos",
    defaultSessionFormat: "sets",
    visibility: "public",
    publicSlug: "friday-ballers",
    shareToken: "b9223472-c84f-4b99-8567-4653e9e910a2",
    schedules: [
      { id: "sch-2", dayOfWeek: 5, kickoffTime: "17:00", venue: "Oniru", active: true },
      { id: "sch-3", dayOfWeek: 7, kickoffTime: "16:00", active: true },
    ],
    players: [
      { id: "f-mike", name: "Mike", active: true }, { id: "f-tunde", name: "Tunde", active: true },
      { id: "f-john", name: "John", active: true }, { id: "f-chidi", name: "Chidi", active: true },
    ],
    sessions: [{
      id: "fs-1", clientSessionId: "fc-1", kickoffAt: "2026-09-04T16:00:00.000Z", format: "sets",
      teams: [{ id: "fr", label: "Red", setWins: 4 }, { id: "fb", label: "Black", setWins: 2 }],
      appearances: [
        { playerId: "f-mike", playerName: "Mike", teamId: "fr", goals: 4, assists: 1 },
        { playerId: "f-tunde", playerName: "Tunde", teamId: "fb", goals: 2, assists: 3 },
        { playerId: "f-john", playerName: "John", teamId: "fr", goals: 3, assists: 1 },
        { playerId: "f-chidi", playerName: "Chidi", teamId: "fb", goals: 1, assists: 1 },
      ],
    }],
  },
];

export const findGroup = (id: string) => demoGroups.find((group) => group.id === id);
export const findPublicGroup = (slug: string) => demoGroups.find((group) => group.visibility === "public" && group.publicSlug === slug);

