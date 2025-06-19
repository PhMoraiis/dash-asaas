-- CreateIndex
CREATE INDEX "webhooks_revendaId_idx" ON "webhooks"("revendaId");

-- CreateIndex
CREATE INDEX "webhooks_produtoId_idx" ON "webhooks"("produtoId");

-- CreateIndex
CREATE INDEX "webhooks_status_idx" ON "webhooks"("status");

-- CreateIndex
CREATE INDEX "webhooks_externalId_idx" ON "webhooks"("externalId");

-- CreateIndex
CREATE INDEX "webhooks_createdAt_idx" ON "webhooks"("createdAt");
