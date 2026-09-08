export function slugify(text: string) {
   return text
      .normalize("NFD") // separa os acentos
      .replace(/[\u0300-\u036f]/g, "") // remove os acentos
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // espaços -> -
      .replace(/[^\w-]+/g, "") // remove caracteres especiais
      .replace(/--+/g, "-"); // evita -- duplicado
}
