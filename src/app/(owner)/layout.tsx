import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { OwnerSidebar } from "@/components/owner/sidebar";
import { SubscriptionWall } from "@/components/owner/subscription-wall";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  if (session.user.role !== "owner") {
    redirect("/scan");
  }

  // Check store subscription status
  const store = await db.store.findFirst({
    where: { ownerId: session.user.id },
  });

  const isExpired =
    store?.subscriptionStatus === "expired" ||
    Boolean(store?.subscriptionRenewalDate && new Date(store.subscriptionRenewalDate) < new Date());

  return (
    <div className="flex-1 flex">
      <OwnerSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-muted/20">
        <SubscriptionWall isExpired={isExpired} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
