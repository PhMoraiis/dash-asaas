import { prisma } from "@/database/clientt";

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Criar admin padrão
  const admin = await prisma.admin.upsert({
    where: { email: "admin@dashboard.com" },
    update: {},
    create: {
      email: "admin@dashboard.com",
      password: "$2b$10$rGOFoXSFbqWPmO0rNDgXQeD9h0XpsFTjzXNJ8sW6LnmJKt8zGz8z6", // password: admin123
      name: "Administrador",
      active: true,
    },
  });

  // Criar revendas de exemplo
  const revenda1 = await prisma.revenda.upsert({
    where: { email: "revenda1@example.com" },
    update: {},
    create: {
      name: "Revenda Tech Solutions",
      email: "revenda1@example.com",
      password: "$2b$10$rGOFoXSFbqWPmO0rNDgXQeD9h0XpsFTjzXNJ8sW6LnmJKt8zGz8z6", // password: revenda123
      externalId: "ext_001",
      active: true,
    },
  });

  const revenda2 = await prisma.revenda.upsert({
    where: { email: "revenda2@example.com" },
    update: {},
    create: {
      name: "Digital Commerce",
      email: "revenda2@example.com",
      password: "$2b$10$rGOFoXSFbqWPmO0rNDgXQeD9h0XpsFTjzXNJ8sW6LnmJKt8zGz8z6", // password: revenda123
      externalId: "ext_002",
      active: true,
    },
  });

  // Criar produtos de exemplo
  await prisma.produto.createMany({
    data: [
      {
        name: "Produto Digital 1",
        description: "Curso online de programação",
        price: 199.99,
        revendaId: revenda1.id,
        externalId: "prod_001",
        active: true,
      },
      {
        name: "Produto Digital 2",
        description: "E-book de marketing digital",
        price: 49.99,
        revendaId: revenda1.id,
        externalId: "prod_002",
        active: true,
      },
      {
        name: "Consultoria Produto 1",
        description: "Consultoria personalizada em vendas",
        price: 899.99,
        revendaId: revenda2.id,
        externalId: "prod_003",
        active: true,
      },
    ],
  });

  console.log("✅ Seed concluído com sucesso!");
  console.log(`👤 Admin criado: ${admin.email}`);
  console.log(`🏪 Revendas criadas: ${revenda1.name}, ${revenda2.name}`);
  console.log("📦 3 produtos criados");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
