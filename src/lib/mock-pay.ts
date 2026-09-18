export async function authorize(_input: {
  amountPaise: number;
  method: string;
}) {
  return { ok: true as const };
}

export const mockPay = { authorize };
