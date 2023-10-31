import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const schema = z.object({
	id: z.string(),
});

export type State = {
	errors?: {
		id: string[];
	};
	message?: string | null;
};
// omit from schema, if necessary
// EXAMPLE:
// const data = invoiceSchema.omit({ id: true });

export async function SERVERACTIONNAME(prevState: State, formData: FormData) {
	// Validate form using Zod
	// If we omit earlier; use the constant here instead
	const validatedFields = schema.safeParse({
		id: formData.get("id"),
	});

	// If form validation fails, return errors early. Otherwise, continue.
	if (!validatedFields.success) {
		return {
			message: "missing fields",
			errors: validatedFields.error.flatten().fieldErrors,
		};
	}

	// Prepare data for insertion into the database
	const { id } = validatedFields.data;

	// Do something with the data
	try {
		await console.log(id);
	} catch (e) {
		console.error(e);
		throw new Error("");
	}

	revalidatePath("/");
	redirect("/");
}
