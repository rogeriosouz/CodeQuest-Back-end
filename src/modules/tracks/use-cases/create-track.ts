import { TracksAlreadyExistsError } from "@/errors/TracksAlreadyExistsError";
import type {
   CreateTrackInput,
   TracksRepository,
} from "../repositories/tracks.repository";

export class CreateTrackUseCase {
   constructor(private readonly tracksRepository: TracksRepository) {}

   async execute(input: CreateTrackInput) {
      const isTrackCreated = await this.tracksRepository.findByName({
         name: input.name,
      });

      if (isTrackCreated) {
         throw new TracksAlreadyExistsError();
      }

      const tracks = await this.tracksRepository.create(input);

      return tracks;
   }
}
