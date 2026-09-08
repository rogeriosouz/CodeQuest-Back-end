import { readFileSync } from "node:fs";
import { join } from "node:path";

interface GetTempleteHtmlRequest {
   htmlTemplete: string;
   replace?: string;
   newValueReplace: string;
}

export function getTempleteHtml({
   htmlTemplete,
   replace,
   newValueReplace,
}: GetTempleteHtmlRequest) {
   const templatePath = join(
      __dirname,
      "..",
      "mail",
      "templates",
      htmlTemplete,
   );

   const templateHtml = readFileSync(templatePath, "utf-8");

   if (replace) {
      const htmlContent = templateHtml.replace(replace, newValueReplace);

      return htmlContent;
   }

   return templateHtml;
}
