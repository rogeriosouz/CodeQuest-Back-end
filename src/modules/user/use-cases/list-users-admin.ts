import type {
   PaginatedUsers,
   UserRepository,
} from "../repositories/user.repository";

interface ListUsersAdminUseCaseRequest {
   search?: string | undefined;
   page: number;
   perPage: number;
}

export class ListUsersAdminUseCase {
   constructor(private userRepository: UserRepository) {}

   async execute({
      search,
      page,
      perPage,
   }: ListUsersAdminUseCaseRequest): Promise<PaginatedUsers> {
      return this.userRepository.findAllAdmin({ search, page, perPage });
   }
}

