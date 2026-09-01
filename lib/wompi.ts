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
