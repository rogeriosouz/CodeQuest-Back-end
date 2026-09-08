export function hasDuelExpired({
   startAt,
   totalTime,
}: {
   startAt: Date;
   totalTime: number;
}): boolean {
   const endAt = startAt.getTime() + totalTime;

   return Date.now() >= endAt;
}
