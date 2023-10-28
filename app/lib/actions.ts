"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const invoiceSchema = z.object({
	id: z.string(),
	customerId: z.string(),
	amount: z.coerce.number(),
	status: z.enum(["paid", "pending"]),
	date: z.string(),
});

const createInvoiceData = invoiceSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
	const { customerId, amount, status } = createInvoiceData.parse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});

	const amountInCents = amount * 100;
	const date = new Date().toISOString().split("T")[0];

	try {
		await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
		`;
	} catch (e) {
		console.error(e);
		throw new Error("Error creating invoice");
	}
	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}

const updateInvoiceData = invoiceSchema.omit({ date: true });

export async function updateInvoice(formData: FormData) {
	const { id, customerId, amount, status } = updateInvoiceData.parse({
		id: formData.get("id"),
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});

	const amountInCents = amount * 100;

	try {
		await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
		`;
	} catch (error) {
		console.error(error);
		throw new Error("Error updating invoice");
	}

	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}

export async function deleteInvoice(formData: FormData) {
	const id = formData.get("id")?.toString();
	try {
		await sql`DELETE FROM invoices WHERE id = ${id}`;
	} catch (e) {
		console.error(e);
		throw new Error("Error deleting invoice");
	}
	revalidatePath("/dashboard/invoices");
}
