export class ProjectAlreadyExistsError extends Error {
   constructor() {
      super("project already exists");
   }
}
