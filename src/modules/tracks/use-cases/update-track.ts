import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import type {
   Tracks,
   TracksRepository,
   UpdateTrackInput,
} from "../repositories/tracks.repository";

export class UpdateTrackUseCase {
   constructor(private readonly tracksRepository: TracksRepository) {}

   async execute(input: UpdateTrackInput): Promise<Tracks> {
      const track = await this.tracksRepository.update(input);

      if (!track) {
         throw new ResourceNotFoundError();
      }

      return track;
   }
}
