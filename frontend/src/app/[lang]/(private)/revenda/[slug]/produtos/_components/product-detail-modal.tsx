import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
	CircleNotchIcon,
	ClipboardIcon,
	CheckIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useDictionary } from "@/hooks/use-dictionary";

// Defina o tipo Product aqui (ou importe de um arquivo compartilhado se preferir)
type Product = {
	id: string;
	name: string;
	description?: string;
	active: boolean;
	createdAt: string;
	updatedAt: string;
	webhookToken: string;
};

export const ProductDetailModal = ({
	open,
	onOpenChange,
	productId,
	onTokenRegenerated,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	productId: string | null;
	onTokenRegenerated?: () => void;
}) => {
	const [webhookToken, setWebhookToken] = useState<string | null>(null);
	const [copiedToken, setCopiedToken] = useState(false);
	const [copiedUrl, setCopiedUrl] = useState(false);
	const dict = useDictionary();

	const fetchProduct = async (): Promise<Product> => {
		const res = await fetchWithAuth(
			`${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}`,
		);
		if (!res.ok) throw new Error("Erro ao buscar produto");
		return res.json();
	};
	const { data, isLoading, error } = useQuery<Product>({
		queryKey: ["product", productId],
		queryFn: fetchProduct,
		enabled: !!productId && open,
	});

	useEffect(() => {
		if (data) setWebhookToken(data.webhookToken);
	}, [data]);

	const product = data as Product | undefined;
	const status = product
		? product.active
			? `${dict.table.active}`
			: `${dict.table.inactive}`
		: "-";
	const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/asaas`;
	const handleCopyToken = async () => {
		await navigator.clipboard.writeText(webhookToken || "");
		setCopiedToken(true);
		toast.success(dict.detailsProductModal.toastSuccesTOKEN);
		setTimeout(() => setCopiedToken(false), 1500);
	};
	const handleCopyUrl = async () => {
		await navigator.clipboard.writeText(webhookUrl);
		setCopiedUrl(true);
		toast.success(dict.detailsProductModal.toastSuccessURL);
		setTimeout(() => setCopiedUrl(false), 1500);
	};
	const regenerateToken = useMutation({
		mutationFn: async () => {
			const res = await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_API_URL}/api/produtos/${productId}/regenerate`,
				{ method: "POST" },
			);
			if (!res.ok) throw new Error("Erro ao regenerar token");
			return res.json();
		},
		onSuccess: (data: Product) => {
			setWebhookToken(data.webhookToken);
			toast.success(dict.detailsProductModal.tokenSuccessRegen);
			if (onTokenRegenerated) onTokenRegenerated();
		},
	});
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="min-w-4xl w-full p-6">
				<DialogHeader>
					<DialogTitle>{dict.detailsProductModal.title}</DialogTitle>
				</DialogHeader>
				{isLoading ? (
					<div className="space-y-4">
						<Skeleton className="h-6 w-1/2" />
						<Skeleton className="h-5 w-1/3" />
						<Skeleton className="h-5 w-1/4" />
						<Skeleton className="h-5 w-1/4" />
						<Skeleton className="h-5 w-1/4" />
						<hr className="my-4" />
						<Skeleton className="h-6 w-1/3" />
						<Skeleton className="h-5 w-2/3" />
						<Skeleton className="h-5 w-1/2" />
						<Skeleton className="h-5 w-1/2" />
						<Skeleton className="h-20 w-full" />
					</div>
				) : error ? (
					<div className="p-6 text-red-500">
						{dict.detailsProductModal.errorLoading}
					</div>
				) : !product ? (
					<div className="p-6">{dict.detailsProductModal.productNotFound}</div>
				) : (
					<div className="space-y-4">
						<div>
							<span className="font-semibold">
								{dict.detailsProductModal.name}{" "}
							</span>
							{product.name}
						</div>
						<div>
							<span className="font-semibold">
								{dict.detailsProductModal.description}{" "}
							</span>
							{product.description || (
								<span className="text-muted-foreground">-</span>
							)}
						</div>
						<div>
							<span className="font-semibold">
								{dict.detailsProductModal.status}{" "}
							</span>
							<Badge variant={product.active ? "default" : "secondary"}>
								{status}
							</Badge>
						</div>
						<div>
							<span className="font-semibold">
								{dict.detailsProductModal.createdAt}{" "}
							</span>
							{new Date(product.createdAt).toLocaleDateString("pt-BR", {
								day: "2-digit",
								month: "2-digit",
								year: "2-digit",
							})}
						</div>
						<div>
							<span className="font-semibold">
								{dict.detailsProductModal.updatedAt}{" "}
							</span>
							{new Date(product.updatedAt).toLocaleDateString("pt-BR", {
								day: "2-digit",
								month: "2-digit",
								year: "2-digit",
							})}
						</div>
						<hr className="my-4" />
						<h2 className="text-lg font-semibold">
							{dict.detailsProductModal.titleConfig}
						</h2>
						<div className="flex flex-col gap-2">
							<div className="flex items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<span className="font-semibold">
										{dict.detailsProductModal.token}
									</span>
									<Badge className="font-mono text-xs px-2 py-1 select-all max-w-full break-all">
										{webhookToken}
									</Badge>
								</div>
								<div className="flex items-center gap-2">
									<Button
										size="sm"
										variant="secondary"
										onClick={() => regenerateToken.mutate()}
										disabled={regenerateToken.isPending}
									>
										{regenerateToken.isPending ? (
											<CircleNotchIcon size={16} className="animate-spin" />
										) : (
											dict.detailsProductModal.regen
										)}
									</Button>
									<Button size="sm" variant="outline" onClick={handleCopyToken}>
										{copiedToken ? (
											<CheckIcon className="text-emerald-500" size={16} />
										) : (
											<ClipboardIcon size={16} />
										)}
									</Button>
								</div>
							</div>
							<div className="flex items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<span className="font-semibold">
										{dict.detailsProductModal.url}
									</span>
									<Badge className="font-mono text-xs px-2 py-1 select-all">
										{webhookUrl}
									</Badge>
								</div>
								<div>
									<Button size="sm" variant="outline" onClick={handleCopyUrl}>
										{copiedUrl ? (
											<CheckIcon className="text-emerald-500" size={16} />
										) : (
											<ClipboardIcon size={16} />
										)}
									</Button>
								</div>
							</div>
						</div>
						<div className="bg-muted rounded-md p-4 mt-4">
							<h3 className="font-semibold mb-2">
								{dict.detailsProductModal.paragraph1}
							</h3>
							<ol className="list-decimal list-inside space-y-1 text-sm">
								<li>
									{dict.detailsProductModal.paragraph2}{" "}
									<b>{dict.detailsProductModal.paragraph3}</b>.
								</li>
								<li>
									{dict.detailsProductModal.paragraph4}{" "}
									<b>{dict.detailsProductModal.paragraph5}</b>.
								</li>
								<li>
									{dict.detailsProductModal.paragraph6}{" "}
									<b>{dict.detailsProductModal.paragraph7}</b>{" "}
									{dict.detailsProductModal.paragraph8}
								</li>
								<li>
									{dict.detailsProductModal.paragraph9}{" "}
									<b>{dict.detailsProductModal.paragraph10}</b>{" "}
									{dict.detailsProductModal.paragraph11}{" "}
									<b>asaas-access-token</b>{" "}
									{dict.detailsProductModal.paragraph12}
								</li>
								<li>{dict.detailsProductModal.paragraph13}</li>
								<li>{dict.detailsProductModal.paragraph14}</li>
							</ol>
							<p className="mt-2 text-xs text-muted-foreground">
								{dict.detailsProductModal.paragraph15}
							</p>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};
