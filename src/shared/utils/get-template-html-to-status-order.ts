import { readFileSync } from "node:fs";
import { join } from "node:path";

interface GetTempleteHtmlRequest {
   htmlTemplete: string;
   numberId: string;
   status:
      | "PENDING"
      | "PAID"
      | "SHIPPED"
      | "DELIVERED"
      | "REFUND_PENDING"
      | "REFUND_REQUIRED"
      | "REFUNDED"
      | "CANCELED";
   total: string;
   linkOrder: string;
   createAt: string;
   userName: string;
   products: {
      name: string;
      size: string;
      color: string;
      quantity: number;
      imageUrl: string;
      totalPrice: string;
   }[];
}

export function getTempleteHtmlStatus({
   htmlTemplete,
   numberId,
   status,
   products,
   total,
   linkOrder,
   createAt,
   userName,
}: GetTempleteHtmlRequest) {
   const templatePath = join(
      __dirname,
      "..",
      "mail",
      "templates",
      htmlTemplete,
   );

   const templateHtml = readFileSync(templatePath, "utf-8");

   const productsList = products
      .map((product) => {
         return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="border-bottom:1px solid #f0f0f0;">
  <tr>

    <!-- imagem -->
    <td width="72" valign="top" style="padding:16px 0;">

      <img
        src="${product.imageUrl}"
        alt="${product.name}"
        width="72"
        height="72"
        style="
          display:block;
          width:72px;
          height:72px;
          border-radius:10px;
          border:1px solid #ebebeb;
          background:#f5f5f5;
          object-fit:cover;
        "
      />

    </td>

    <td width="16"></td>

    <!-- infos -->
    <td valign="top" style="padding:16px 0;">

      <div
        style="
          font-size:15px;
          font-weight:700;
          color:#141414;
          line-height:1.3;
        ">
        ${product.name}
      </div>

      <div
        style="
          font-size:13px;
          color:#737373;
          margin-top:2px;
        ">
        Tam: ${product.size}
      </div>

      <div
        style="
          font-size:12px;
          color:#a3a3a3;
          margin-top:2px;
        ">
        Qtd: ${product.quantity}
      </div>

    </td>

    <td width="16"></td>

    <!-- preço -->
    <td valign="top" align="right" style="padding:16px 0;white-space:nowrap;">

      <div
        style="
          font-size:15px;
          font-weight:700;
          color:#141414;
        ">
        ${product.totalPrice}
      </div>

    </td>

  </tr>
</table>

    `;
      })
      .join("");

   const statusData = {
      PENDING: {
         label: "Pedido Confirmado",
         title: "Seu pedido foi confirmado! Aguardando pagamento",
         description:
            "Recebemos seu pedido com sucesso. Assim que o pagamento for confirmado, iniciaremos o processamento do seu pedido.",
         color: "#1a7a4c",
         bgColor: "#f0fdf4",
         borderColor: "#bbf7d0",
      },
      PAID: {
         label: "Em Processamento",
         title: "Seu pedido esta sendo preparado",
         description:
            "Estamos separando e embalando seus produtos com cuidado. Em breve ele sera enviado.",
         color: "#b45309",
         bgColor: "#fffbeb",
         borderColor: "#fde68a",
      },
      SHIPPED: {
         label: "Enviado",
         title: "Seu pedido esta a caminho!",
         description:
            "Boa noticia! Seu pedido foi enviado e esta a caminho do endereco de entrega.",
         color: "#1d4ed8",
         bgColor: "#eff6ff",
         borderColor: "#bfdbfe",
      },
      DELIVERED: {
         label: "Entregue",
         title: "Pedido entregue com sucesso!",
         description:
            "Seu pedido foi entregue! Esperamos que voce aproveite seus produtos.",
         color: "#15803d",
         bgColor: "#f0fdf4",
         borderColor: "#bbf7d0",
      },
      CANCELED: {
         label: "Pedido cancelado",
         title: "Seu pedido foi cancelado",
         description:
            "Este pedido foi cancelado e não sera mais processado. Se voce tiver qualquer duvida, entre em contato com nosso atendimento.",
         color: "#991b1b",
         bgColor: "#f7b7b7",
         borderColor: "#fecaca",
      },

      REFUND_PENDING: {
         label: "Reembolso solicitado",
         title: "Recebemos sua solicitação de reembolso",
         description:
            "Seu pedido de reembolso foi registrado e esta em analise. Assim que for aprovado, o valor sera estornado.",
         color: "#92400e",
         bgColor: "#fffbeb",
         borderColor: "#fde68a",
      },

      REFUND_REQUIRED: {
         label: "Reembolso necessario",
         title: "Este pedido precisa de reembolso",
         description:
            "Identificamos que este pedido precisa ser reembolsado. Nossa equipe ira analisar e iniciar o processo de estorno em breve.",
         color: "#9a3412",
         bgColor: "#fff7ed",
         borderColor: "#fed7aa",
         iconBg: "#ffedd5",
         icon: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
      },

      REFUNDED: {
         label: "Reembolso concluído",
         title: "Seu reembolso foi realizado",
         description:
            "O valor do seu pedido foi estornado com sucesso. O prazo para aparecer na sua fatura pode variar de acordo com a operadora.",
         color: "#1d4ed8",
         bgColor: "#eff6ff",
         borderColor: "#bfdbfe",
      },
   };

   const header = `
  <table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    background-color: ${statusData[status].bgColor};
    border-top: 1px solid ${statusData[status].bgColor};
    border-bottom: 1px solid ${statusData[status].bgColor};
  "
>
  <tr>
    <td style="padding:24px 32px;">

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <!-- text -->
          <td valign="top">

            <div
              style="
                font-size:11px;
                font-weight:600;
                text-transform:uppercase;
                letter-spacing:0.08em;
                margin-bottom:4px;
                color:#1a7a4c;
              "
            >
              ${statusData[status].label}
            </div>

            <div
              style="
                font-size:18px;
                font-weight:700;
                color:#141414;
                margin-bottom:6px;
                line-height:1.3;
              "
            >
               ${statusData[status].title}
            </div>

            <div
              style="
                font-size:14px;
                color:#525252;
                line-height:1.5;
              "
            >
              ${statusData[status].description}
            </div>

          </td>

        </tr>
      </table>

    </td>
  </tr>
</table>`;

   const statusHtml = `
   <table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding:24px 32px 8px 32px;">

      <table cellpadding="0" cellspacing="0" border="0">
        <tr>

          <!-- STEP 1 -->
          <td align="center" valign="top" style="width: 100px">

            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td
                  align="center"
                  width="28"
                  height="28"
                  style="
                    border-radius:50%;
                    font-size:14px;
                    font-weight:700;
                    color:#ffffff;
                    ${
                       status === "PENDING" ||
                       status === "PAID" ||
                       status === "SHIPPED" ||
                       status === "DELIVERED"
                          ? "background:#1a7a4c;"
                          : "background:#f5f5f5;color:#d4d4d4;"
                    }
                  ">
                  ${
                     status === "PENDING" ||
                     status === "PAID" ||
                     status === "SHIPPED" ||
                     status === "DELIVERED"
                        ? "✓"
                        : ""
                  }
                </td>
              </tr>
            </table>

            <div style="font-size:11px;color:#a3a3a3;font-weight:500;margin-top:8px;text-align:center;">
              Confirmado<br />(esperando pagamento)
            </div>

          </td>

          <!-- CONNECTOR 1 -->
          <td width="24" align="center" valign="middle" style="width: 80px"> 
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius: 50px">
              <tr>
                <td
                  height="3"
                  style="
                    font-size:0;
                    line-height:0;
                    ${
                       status === "PAID" ||
                       status === "SHIPPED" ||
                       status === "DELIVERED"
                          ? "background:#1a7a4c;"
                          : "background:#a3a3a3;"
                    }
                  ">
                  &nbsp;
                </td>
              </tr>
            </table>
          </td>

          <!-- STEP 2 -->
          <td align="center" valign="top" style="width: 100px">

            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td
                  align="center"
                  width="28"
                  height="28"
                  style="
                    border-radius:50%;
                    font-size:14px;
                    font-weight:700;
                    color:#ffffff;
                    ${
                       status === "PAID" ||
                       status === "SHIPPED" ||
                       status === "DELIVERED"
                          ? "background:#1a7a4c;"
                          : "background:#f5f5f5;color:#d4d4d4;"
                    }
                  ">
                  ${status === "PAID" || status === "SHIPPED" || status === "DELIVERED" ? "✓" : ""}
                </td>
              </tr>
            </table>

            <div style="font-size:11px;color:#a3a3a3;font-weight:500;margin-top:8px;text-align:center;">
              Processando
            </div>

          </td>

          <!-- CONNECTOR 2 -->
          <td width="24" align="center" valign="middle" style="width: 80px">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius: 50px">
              <tr>
                <td
                  height="3"
                  style="
                    font-size:0;
                    line-height:0;
                    ${
                       status === "SHIPPED" || status === "DELIVERED"
                          ? "background:#1a7a4c;"
                          : "background:#a3a3a3;"
                    }
                  ">
                  &nbsp;
                </td>
              </tr>
            </table>
          </td>

          <!-- STEP 3 -->
          <td align="center" valign="top" style="width: 100px">

            <table cellpadding="0" cellspacing="0" border="0" >
              <tr>
                <td
                  align="center"
                  width="28"
                  height="28"
                  style="
                    border-radius:50%;
                    font-size:14px;
                    font-weight:700;
                    color:#ffffff;
                    ${
                       status === "SHIPPED" || status === "DELIVERED"
                          ? "background:#1a7a4c;"
                          : "background:#f5f5f5;color:#d4d4d4;"
                    }
                  ">
                  ${status === "SHIPPED" || status === "DELIVERED" ? "✓" : ""}
                </td>
              </tr>
            </table>

            <div style="font-size:11px;color:#a3a3a3;font-weight:500;margin-top:8px;text-align:center;">
              Enviado
            </div>

          </td>

          <!-- CONNECTOR 3 -->
          <td width="24" align="center" valign="middle" style="width: 80px">
            <table cellpadding="0" cellspacing="0" border="0"  width="100%" style="border-radius: 50px">
              <tr>
                <td
                  height="3"
                  style="
                    font-size:0;
                    line-height:0;
                    ${status === "DELIVERED" ? "background:#1a7a4c;" : "background:#a3a3a3;"}
                  ">
                  &nbsp;
                </td>
              </tr>
            </table>
          </td>

          <!-- STEP 4 -->
          <td align="center" valign="top" style="width: 100px">

            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td
                  align="center"
                  width="28"
                  height="28"
                  style="
                    border-radius:50%;
                    font-size:14px;
                    font-weight:700;
                    color:#ffffff;
                    ${
                       status === "DELIVERED"
                          ? "background:#1a7a4c;"
                          : "background:#f5f5f5;color:#d4d4d4;"
                    }
                  ">
                  ${status === "DELIVERED" ? "✓" : ""}
                </td>
              </tr>
            </table>

            <div style="font-size:11px;color:#a3a3a3;font-weight:500;margin-top:8px;text-align:center;">
              Entregue
            </div>

          </td>

        </tr>
      </table>

    </td>
  </tr>
</table>
  `;

   const htmlContent = templateHtml
      .replace("{{numberId}}", numberId)
      .replace("{{header}}", header)
      .replace("{{status}}", status)
      .replace("{{products}}", productsList)
      .replaceAll("{{total}}", total)
      .replace("{{linkOrder}}", linkOrder)
      .replace("{{date}}", createAt)
      .replace(
         "{{statusHtml}}",
         status === "CANCELED" ||
            status === "REFUNDED" ||
            status === "REFUND_PENDING" ||
            status === "REFUND_REQUIRED"
            ? ""
            : statusHtml,
      )
      .replace("{{userName}}", userName);

   return htmlContent;
}
