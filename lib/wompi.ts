function wompiApiBase(publicKey: string): string {
  return publicKey.startsWith("pub_prod_")
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";
}

export async function tokenizeCard(params: {
  publicKey: string;
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}): Promise<string> {
  const res = await fetch(`${wompiApiBase(params.publicKey)}/tokens/cards`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.publicKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      number: params.number.replace(/\s+/g, ""),
      cvc: params.cvc,
      exp_month: params.expMonth,
      exp_year: params.expYear,
      card_holder: params.cardHolder,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json?.data?.id) {
    const message = json?.error?.messages ? JSON.stringify(json.error.messages) : "Revisa los datos de la tarjeta.";
    throw new Error(message);
  }
  return json.data.id as string;
}

/** Nequi como medio de pago recurrente: Wompi le manda a la persona una
 * solicitud de suscripción a su app de Nequi; cuando la acepta, el token
 * pasa de PENDING a APPROVED y el servidor lo guarda como fuente de pago
 * (igual que una tarjeta) para cobrarle cada mes. Espera hasta ~3 minutos
 * — si la persona se va a la app de Nequi y vuelve, el sondeo sigue. */
export async function tokenizeNequi(params: {
  publicKey: string;
  telefono: string;
  onEsperando?: () => void;
}): Promise<string> {
  const telefono = params.telefono.replace(/\D/g, "");
  if (telefono.length !== 10) throw new Error("Escribe el número de celular de tu cuenta Nequi (10 dígitos).");
  const base = wompiApiBase(params.publicKey);
  const res = await fetch(`${base}/tokens/nequi`, {
    method: "POST",
    headers: { Authorization: `Bearer ${params.publicKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: telefono }),
  });
  const json = await res.json();
  const token = json?.data?.id as string | undefined;
  if (!res.ok || !token) {
    throw new Error(json?.error?.messages ? JSON.stringify(json.error.messages) : "No pudimos conectar con Nequi. Revisa el número.");
  }
  params.onEsperando?.();
  for (let intento = 0; intento < 60; intento++) {
    await new Promise((r) => setTimeout(r, 3000));
    const estadoRes = await fetch(`${base}/tokens/nequi/${token}`, {
      headers: { Authorization: `Bearer ${params.publicKey}` },
    });
    const estado = (await estadoRes.json().catch(() => null))?.data?.status as string | undefined;
    if (estado === "APPROVED") return token;
    if (estado && estado !== "PENDING") throw new Error("La solicitud en Nequi fue rechazada o expiró. Inténtalo de nuevo.");
  }
  throw new Error("No vimos la aprobación en Nequi a tiempo. Vuelve a intentarlo y acepta la solicitud en tu app.");
}
