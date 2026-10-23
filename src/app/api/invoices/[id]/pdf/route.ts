import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/customer-auth";
import { db } from "@/db";
import { invoices, invoiceItems, clients, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateInvoicePdfBuffer } from "@/lib/pdf/generator";
import { getBusinessPlanStatus } from "@/lib/subscriptions/limits";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCustomerSession();
    if (!session || !session.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const records = await db
      .select({
        invoice: invoices,
        client: clients,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(and(eq(invoices.id, id), eq(invoices.businessId, session.businessId)));

    if (!records.length) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { invoice, client } = records[0];

    const [biz] = await db.select().from(businesses).where(eq(businesses.id, session.businessId));

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id))
      .orderBy(invoiceItems.sortOrder);

    const planStatus = await getBusinessPlanStatus(session.businessId);

    const pdfBuffer = await generateInvoicePdfBuffer({
      business: {
        name: biz.name,
        email: biz.email,
        phone: biz.phone,
        address: biz.address,
        logoUrl: biz.logoUrl,
      },
      client: {
        name: client?.name || "Client",
        company: client?.company,
        email: client?.email,
        phone: client?.phone,
        address: client?.address,
      },
      invoice: {
        number: invoice.number,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        currency: invoice.currency,
        subtotal: invoice.subtotal,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        discountRate: invoice.discountRate,
        discountAmount: invoice.discountAmount,
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        balanceDue: invoice.balanceDue,
        status: invoice.status,
        notes: invoice.notes,
        paymentInstructions: invoice.paymentInstructions,
      },
      items: items.map((it: typeof invoiceItems.$inferSelect) => ({
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        amount: it.amount,
      })),
      showBranding: !planStatus.plan.features.removeBranding,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
      },
    });
  } catch (err: unknown) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
