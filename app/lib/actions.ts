'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Define the form schema using Zod for validation
const FormSchema = z.object({
  id: z.string(),
  sellerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['awaiting', 'fulfilled']),
  date: z.string(),
});

// Define specific schemas for invoices
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { sellerId, amount, status } = CreateInvoice.parse({
    sellerId: formData.get('sellerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  await sql`
  INSERT INTO invoices (seller_id, amount, status, date)
  VALUES (${sellerId}, ${amountInCents}, ${status}, ${date})
`;

  // remove the cache for the invoices page to see the new invoice
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const { sellerId, amount, status } = UpdateInvoice.parse({
    sellerId: formData.get('sellerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET seller_id = ${sellerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}