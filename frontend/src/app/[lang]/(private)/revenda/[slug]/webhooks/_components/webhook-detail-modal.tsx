import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { ClipboardIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";

export type Webhook = {
	id: string;
	event: string;
	status: string;
	produtoId: string | null;
	createdAt: string;
	// biome-ignore lint/suspicious/noExplicitAny: ignore
	payload: Record<string, any>;
};

export const WebhookDetailModal = ({
	open,
	onOpenChange,
	webhook,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	webhook: Webhook | null;
}) => {
	const [copied, setCopied] = useState(false);
	if (!webhook) return null;

	const handleCopyPayload = async () => {
		await navigator.clipboard.writeText(
			JSON.stringify(webhook.payload, null, 2),
		);
		setCopied(true);
		toast.success("Payload copiado!");
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="min-w-4xl w-full h-[90%] overflow-y-scroll p-6">
				<DialogHeader>
					<DialogTitle>Detalhes do Webhook</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<span className="font-semibold">Evento: </span>
						{webhook.event}
					</div>
					<div>
						<span className="font-semibold">Status: </span>
						<Badge>{webhook.status}</Badge>
					</div>
					<div>
						<span className="font-semibold">Produto: </span>
						{webhook.produtoId || (
							<span className="text-muted-foreground">-</span>
						)}
					</div>
					<div>
						<span className="font-semibold">Recebido em: </span>
						{new Date(webhook.createdAt).toLocaleString("pt-BR")}
					</div>
					<hr className="my-4" />
					<h2 className="text-lg font-semibold">Payload Recebido</h2>
					<div className="relative bg-muted rounded-md p-4 font-mono text-xs overflow-x-auto">
						<pre className="whitespace-pre-wrap break-all">
							{JSON.stringify(webhook.payload, null, 2)}
						</pre>
						<Button
							size="icon"
							variant="outline"
							onClick={handleCopyPayload}
							className="absolute top-2 right-2"
							title="Copiar JSON"
						>
							{copied ? (
								<CheckIcon className="text-emerald-500" size={16} />
							) : (
								<ClipboardIcon size={16} />
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
