export function generateLevelTable(totalAppXp: number) {
   const levels = [0];

   let accumulatedXp = 0;
   let xpForNextLevel = 300;

   while (accumulatedXp + xpForNextLevel < totalAppXp) {
      accumulatedXp += xpForNextLevel;

      levels.push(accumulatedXp);

      xpForNextLevel = Math.floor(xpForNextLevel * 1.25);
   }

   levels.push(totalAppXp);

   return levels;
}

export function calculateLevel(userXp: number, totalAppXp: number) {
   const levelTable = generateLevelTable(totalAppXp);

   let level = 1;

   for (const [index, requiredXp] of levelTable.entries()) {
      if (userXp >= requiredXp) {
         level = index + 1;
      }
   }

   const currentLevelXp = levelTable[level - 1] ?? 0;

   const nextLevelXp = levelTable[level] ?? currentLevelXp;

   const xpToNextLevel = Math.max(0, nextLevelXp - userXp);

   const progressPercentage =
      level === levelTable.length
         ? 100
         : ((userXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

   return {
      level,
      maxLevel: levelTable.length,
      xpToNextLevel,
      progressPercentage,
      currentXp: userXp,
      maxXp: totalAppXp,
   };
}
