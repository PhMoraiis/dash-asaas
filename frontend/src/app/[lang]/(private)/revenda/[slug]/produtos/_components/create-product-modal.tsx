import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleNotchIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDictionary } from "@/hooks/use-dictionary";

const createProductSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	description: z.string(),
});

type CreateProductForm = z.infer<typeof createProductSchema>;

interface CreateProductModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateProductModal({
	open,
	onOpenChange,
}: CreateProductModalProps) {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<CreateProductForm>({
		resolver: zodResolver(createProductSchema),
	});

	const queryClient = useQueryClient();
	const dict = useDictionary();

	const createMutation = useMutation({
		mutationFn: async (data: CreateProductForm) => {
			const res = await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_API_URL}/api/products`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				},
			);
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err?.message || "Erro ao criar produto.");
			}
			return res.json();
		},
		onSuccess: () => {
			toast.success(dict.createProductModal.toastSuccess);
			queryClient.invalidateQueries({ queryKey: ["products"] });
			onOpenChange(false);
			reset();
		},
	});

	function onSubmit(data: CreateProductForm) {
		createMutation.mutate(data);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{dict.createProductModal.title}</DialogTitle>
					<DialogDescription>
						{dict.createProductModal.description}
					</DialogDescription>
				</DialogHeader>
				<form
					className="flex flex-col gap-6 mt-2"
					onSubmit={handleSubmit(onSubmit)}
				>
					<div className="space-y-2">
						<Label htmlFor="name">{dict.common.name}</Label>
						<Input id="name" {...register("name")} />
						{errors.name && (
							<span className="text-red-500 text-xs">
								{errors.name.message}
							</span>
						)}
					</div>
					<div className="space-y-2 mb-4">
						<Label htmlFor="description">
							{dict.createProductModal.descriptionLabel}
						</Label>
						<Input
							id="description"
							type="description"
							{...register("description")}
						/>
						{errors.description && (
							<span className="text-red-500 text-xs">
								{errors.description.message}
							</span>
						)}
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="secondary">
								{dict.common.cancel}
							</Button>
						</DialogClose>
						<Button
							type="submit"
							className="w-full gap-4"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<CircleNotchIcon size={22} className="animate-spin" />
							) : (
								<div className="flex items-center justify-center">
									<PlusIcon className="mr-2 h-4 w-4" />
									{dict.createProductModal.addProduct}
								</div>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
