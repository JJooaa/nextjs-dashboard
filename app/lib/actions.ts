"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const invoiceSchema = z.object({
	id: z.string(),
	customerId: z.string({
		invalid_type_error: "Please select a customer",
	}),
	amount: z.coerce.number().gt(0, { message: "Amount must be greater than 0" }),
	status: z.enum(["paid", "pending"], {
		invalid_type_error: "Please select a status",
	}),
	date: z.string(),
});

export type State = {
	errors?: {
		customerId?: string[];
		amount?: string[];
		status?: string[];
	};
	message?: string | null;
};

const createInvoiceData = invoiceSchema.omit({ id: true, date: true });

// Create invoice
export async function createInvoice(prevState: State, formData: FormData) {
	// Validate form using Zod
	const validatedFields = createInvoiceData.safeParse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});

	// If form validation fails, return errors early. Otherwise, continue.
	if (!validatedFields.success) {
		return {
			message: "missing fields",
			errors: validatedFields.error.flatten().fieldErrors,
		};
	}

	// Prepare data for insertion into the database
	const { customerId, amount, status } = validatedFields.data;
	const amountInCents = amount * 100;
	const date = new Date().toISOString().split("T")[0];

	// Insert data into the database
	try {
		await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
		`;
	} catch (e) {
		// If a database error occurs, return a more specific error.
		throw new Error("Error creating invoice");
	}

	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}

// Update invoice
const updateInvoiceData = invoiceSchema.omit({ date: true });

export async function updateInvoice(prevState: State, formData: FormData) {
	const validatedFields = updateInvoiceData.safeParse({
		id: formData.get("id"),
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});

	if (!validatedFields.success) {
		return {
			message: "missing fields",
			errors: validatedFields.error.flatten().fieldErrors,
		};
	}

	const { id, customerId, amount, status } = validatedFields.data;
	const amountInCents = amount * 100;

	try {
		await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
		`;
	} catch (error) {
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
