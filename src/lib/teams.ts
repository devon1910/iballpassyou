export function shuffledTeamAssignments(
  playerIds: string[],
  teamCount: number,
  random: () => number = Math.random,
) {
  if (teamCount < 1) return new Map<string, number>();

  const shuffled = [...playerIds];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapWith]] = [shuffled[swapWith], shuffled[index]];
  }

  return new Map(shuffled.map((playerId, index) => [playerId, index % teamCount]));
}
