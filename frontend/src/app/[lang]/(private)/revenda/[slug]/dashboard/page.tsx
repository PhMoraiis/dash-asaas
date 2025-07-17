/** biome-ignore-all lint/suspicious/noExplicitAny: ignore */
"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
	BarChart,
	Bar,
	XAxis,
	CartesianGrid,
} from "recharts";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { useDictionary } from "@/hooks/use-dictionary";

// Hook para pegar as cores dos charts do CSS
function useChartColors() {
	const [colors, setColors] = useState<string[]>([]);
	useEffect(() => {
		const style = getComputedStyle(document.documentElement);
		setColors([
			style.getPropertyValue("--chart-1").trim(),
			style.getPropertyValue("--chart-2").trim(),
			style.getPropertyValue("--chart-3").trim(),
			style.getPropertyValue("--chart-4").trim(),
			style.getPropertyValue("--chart-5").trim(),
		]);
	}, []);
	return colors;
}

export default function RevendaDashboard() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [pizzaData, setPizzaData] = useState<any>(null);
	const [barData, setBarData] = useState<any>(null);
	const chartColors = useChartColors();
	const dict = useDictionary();

	useEffect(() => {
		async function fetchData() {
			setLoading(true);
			setError(null);
			try {
				const [pizzaRes, barRes] = await Promise.all([
					fetchWithAuth(
						`${process.env.NEXT_PUBLIC_API_URL}/api/charts/clients-vs-sales-today`,
					),
					fetchWithAuth(
						`${process.env.NEXT_PUBLIC_API_URL}/api/charts/monthly-revenue`,
					),
				]);
				if (!pizzaRes.ok || !barRes.ok)
					throw new Error("Erro ao buscar dados dos gráficos");
				const pizza = await pizzaRes.json();
				const bar = await barRes.json();
				setPizzaData(pizza);
				setBarData(bar);
			} catch (e: any) {
				setError(e.message || "Erro ao buscar dados dos gráficos");
			} finally {
				setLoading(false);
			}
		}
		fetchData();
	}, []);

	// Configuração para ChartStyle do gráfico de barras
	const barChartConfig: ChartConfig = {
		Faturado: {
			label: `${dict.resellerDashboard.labelFaturado}`,
			color: chartColors[0],
		},
		Pago: {
			label: `${dict.resellerDashboard.labelPago}`,
			color: chartColors[1],
		},
		Líquido: {
			label: `${dict.resellerDashboard.labelLiquido}`,
			color: chartColors[2],
		},
	};

	return (
		<div className="flex flex-1 flex-col">
			<div className="flex flex-1 flex-col gap-2">
				<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 lg:px-6">
						{/* Gráfico Pizza: Cliente x Venda Hoje */}
						<Card>
							<CardHeader>
								<CardTitle>{dict.resellerDashboard.firstChartTitle}</CardTitle>
								<CardDescription>
									{dict.resellerDashboard.firstChartDescription}
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col items-center justify-center">
								{loading ? (
									<div>
										<CircleNotchIcon className="animate-spin" />
									</div>
								) : error ? (
									<div className="text-red-500">{error}</div>
								) : pizzaData ? (
									<div className="relative flex flex-col items-center justify-center w-full h-64">
										<ResponsiveContainer width="100%" height="100%">
											<PieChart>
												<Pie
													data={pizzaData.labels.map(
														(label: string, i: number) => ({
															name: label,
															value: pizzaData.datasets[0].data[i],
														}),
													)}
													dataKey="value"
													nameKey="name"
													cx="50%"
													cy="50%"
													innerRadius={60}
													outerRadius={90}
													fill="#8884d8"
													label
												>
													{pizzaData.labels.map((_: string, i: number) => (
														<Cell
															key={`cell-${
																// biome-ignore lint/suspicious/noArrayIndexKey: ignore
																i
															}`}
															fill={
																chartColors[i % chartColors.length] || "#ccc"
															}
														/>
													))}
												</Pie>
												<Tooltip />
											</PieChart>
										</ResponsiveContainer>
										<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
											<span className="text-2xl font-bold">
												{pizzaData.clientes}
											</span>
											<span className="text-xs text-muted-foreground">
												{dict.resellerDashboard.firstChartLabel}
											</span>
										</div>
									</div>
								) : null}
							</CardContent>
						</Card>
						{/* Gráfico Barras: Faturamento Mês */}
						<Card>
							<CardHeader>
								<CardTitle>{dict.resellerDashboard.secondChartTitle}</CardTitle>
								<CardDescription>
									{dict.resellerDashboard.secondChartDescription}
								</CardDescription>
							</CardHeader>
							<CardContent className="h-64">
								{loading ? (
									<div>
										<CircleNotchIcon className="animate-spin" />
									</div>
								) : error ? (
									<div className="text-red-500">{error}</div>
								) : barData ? (
									<div className="h-full w-full">
										<ChartContainer
											config={barChartConfig}
											className="h-full w-full"
										>
											<BarChart
												width={undefined}
												height={undefined}
												data={barData.labels.map(
													(label: string, i: number) => ({
														date: label,
														Faturado: barData.datasets[0].data[i],
														Pago: barData.datasets[1].data[i],
														Líquido: barData.datasets[2].data[i],
													}),
												)}
											>
												<CartesianGrid vertical={false} />
												<XAxis
													dataKey="date"
													tickLine={false}
													tickMargin={10}
													axisLine={false}
													tickFormatter={(value) => {
														// Se for "2024-07-01", retorna "01/07"
														if (
															typeof value === "string" &&
															value.length >= 10
														) {
															const [_ano, mes, dia] = value.split("-");
															return `${dia}/${mes}`;
														}
														return String(value);
													}}
												/>
												<ChartTooltip
													cursor={false}
													content={<ChartTooltipContent indicator="dashed" />}
												/>
												<Bar
													dataKey="Faturado"
													fill="var(--chart-1)"
													radius={4}
												/>
												<Bar dataKey="Pago" fill="var(--chart-2)" radius={4} />
												<Bar
													dataKey="Líquido"
													fill="var(--chart-3)"
													radius={4}
												/>
											</BarChart>
										</ChartContainer>
									</div>
								) : null}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
