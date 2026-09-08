export interface Friends {
   id: string;
   name: string;
   displayName: string | null;
   level: number;
}

export interface RequestFriends {
   name: string;
   displayName: string | null;
   requestFriendId: string;
   createAt: Date;
}

export interface FriendsRepository {
   findAll({ userId }: { userId: string }): Promise<Friends[]>;

   findByIdRequestFriend(
      requestFriendId: string,
   ): Promise<RequestFriends | null>;

   requestFriend({
      senderId,
      receiverId,
   }: {
      senderId: string;
      receiverId: string;
   }): Promise<void>;

   acceptFriend({
      requestFriendId,
   }: {
      requestFriendId: string;
   }): Promise<void>;

   refuseRequestFriends({
      requestFriendId,
   }: {
      requestFriendId: string;
   }): Promise<void>;

   listOneRequestFriends({
      userId,
      friendId,
   }: {
      userId: string;
      friendId: string;
   }): Promise<RequestFriends | null>;

   listAllRequestFriends({
      userId,
   }: {
      userId: string;
   }): Promise<RequestFriends[]>;

   listOneFriend({
      friendId,
      userId,
   }: {
      friendId: string;
      userId: string;
   }): Promise<Friends | null>;

   searchUsers({
      query,
      userId,
   }: {
      query: string;
      userId: string;
   }): Promise<Friends[]>;
}
