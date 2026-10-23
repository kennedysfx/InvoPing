import { db } from "./index";
import {
  users,
  businesses,
  businessMembers,
  clients,
  invoices,
  invoiceItems,
  payments,
  reminders,
  reminderTemplates,
  subscriptions,
  usage,
  activityLogs,
  adminActivityLogs,
} from "./schema";

export async function seedDatabase() {
  console.log("🌱 Starting InvoPing Database Seed...");



  // 2. Create Demo Customer & Business
  const [user] = await db
    .insert(users)
    .values({
      email: "owner@acmedesign.com",
      name: "Sarah Jenkins",
      onboardingCompleted: true,
    })
    .onConflictDoNothing()
    .returning();

  if (!user) {
    console.log("⚠️ Seed data already exists or user creation skipped.");
    return;
  }

  const [business] = await db
    .insert(businesses)
    .values({
      name: "Acme Design Studio",
      email: "billing@acmedesign.com",
      phone: "+1 415 555 0199",
      address: "100 Market St, Suite 400, San Francisco, CA 94105",
      currency: "USD",
      invoicePrefix: "INV-",
      paymentInstructions: "Bank: Silicon Valley Bank\nAccount: 9876543210\nRouting: 123456789\nPayPal: pay@acmedesign.com",
    })
    .returning();

  await db.insert(businessMembers).values({
    businessId: business.id,
    userId: user.id,
    role: "OWNER",
  });

  // 3. Subscription (STARTER Plan)
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(subscriptions).values({
    businessId: business.id,
    plan: "STARTER",
    status: "ACTIVE",
    currentPeriodStart: now,
    currentPeriodEnd: nextMonth,
  });

  // 4. Usage Record
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  await db.insert(usage).values({
    businessId: business.id,
    periodStart: currentMonthStr,
    invoiceCount: 4,
    clientCount: 3,
  });

  // 5. Clients
  const [client1] = await db
    .insert(clients)
    .values({
      businessId: business.id,
      name: "John Doe",
      company: "TechCorp Global",
      email: "john@techcorp.com",
      phone: "+1 415 555 0122",
      address: "500 Howard St, San Francisco, CA",
      notes: "VIP Enterprise client. Net 15 payment terms.",
    })
    .returning();

  const [client2] = await db
    .insert(clients)
    .values({
      businessId: business.id,
      name: "Elena Rostova",
      company: "Globex Digital",
      email: "elena@globexdigital.io",
      phone: "+44 7700 900077",
      address: "25 Finsbury Square, London, UK",
      notes: "Communicates primarily on WhatsApp.",
    })
    .returning();

  const [client3] = await db
    .insert(clients)
    .values({
      businessId: business.id,
      name: "Marcus Aurelius",
      company: "Starlight Media",
      email: "marcus@starlight.com",
      phone: "+1 310 555 0144",
      address: "101 Sunset Blvd, Los Angeles, CA",
    })
    .returning();

  // 6. Invoices
  // Invoice 1: PAID (Full Payment)
  const [inv1] = await db
    .insert(invoices)
    .values({
      businessId: business.id,
      clientId: client1.id,
      number: "INV-0001",
      issueDate: "2026-09-01",
      dueDate: "2026-09-15",
      currency: "USD",
      subtotal: "2500.00",
      taxRate: "10.00",
      taxAmount: "250.00",
      discountRate: "0.00",
      discountAmount: "0.00",
      total: "2750.00",
      amountPaid: "2750.00",
      balanceDue: "0.00",
      status: "PAID",
      publicToken: "tok_demo_inv0001_paid_secret32",
      notes: "Thank you for your business!",
      paymentInstructions: business.paymentInstructions,
      firstViewedAt: new Date("2026-09-02T10:30:00Z"),
    })
    .returning();

  await db.insert(invoiceItems).values([
    { invoiceId: inv1.id, description: "Brand Identity Design System", quantity: "1.00", unitPrice: "2000.00", amount: "2000.00", sortOrder: 0 },
    { invoiceId: inv1.id, description: "Social Media Kit & Assets", quantity: "1.00", unitPrice: "500.00", amount: "500.00", sortOrder: 1 },
  ]);

  await db.insert(payments).values({
    invoiceId: inv1.id,
    businessId: business.id,
    amount: "2750.00",
    paymentDate: "2026-09-10",
    method: "Bank Transfer",
    reference: "WIRE-998231",
    notes: "Full payment received.",
  });

  // Invoice 2: VIEWED with Partial Payment
  const [inv2] = await db
    .insert(invoices)
    .values({
      businessId: business.id,
      clientId: client2.id,
      number: "INV-0002",
      issueDate: "2026-09-15",
      dueDate: "2026-09-30",
      currency: "USD",
      subtotal: "1800.00",
      taxRate: "0.00",
      taxAmount: "0.00",
      discountRate: "5.00",
      discountAmount: "90.00",
      total: "1710.00",
      amountPaid: "500.00",
      balanceDue: "1210.00",
      status: "VIEWED",
      publicToken: "tok_demo_inv0002_partial_secret",
      notes: "50% upfront deposit received.",
      paymentInstructions: business.paymentInstructions,
      firstViewedAt: new Date("2026-09-16T14:15:00Z"),
    })
    .returning();

  await db.insert(invoiceItems).values([
    { invoiceId: inv2.id, description: "Next.js Web Application Frontend", quantity: "30.00", unitPrice: "50.00", amount: "1500.00", sortOrder: 0 },
    { invoiceId: inv2.id, description: "UI/UX Figma Component Library", quantity: "1.00", unitPrice: "300.00", amount: "300.00", sortOrder: 1 },
  ]);

  await db.insert(payments).values({
    invoiceId: inv2.id,
    businessId: business.id,
    amount: "500.00",
    paymentDate: "2026-09-17",
    method: "PayPal",
    reference: "PP-771829",
    notes: "Initial partial deposit.",
  });

  // Invoice 3: OVERDUE
  const [inv3] = await db
    .insert(invoices)
    .values({
      businessId: business.id,
      clientId: client3.id,
      number: "INV-0003",
      issueDate: "2026-08-20",
      dueDate: "2026-09-05",
      currency: "USD",
      subtotal: "1200.00",
      taxRate: "0.00",
      taxAmount: "0.00",
      discountRate: "0.00",
      discountAmount: "0.00",
      total: "1200.00",
      amountPaid: "0.00",
      balanceDue: "1200.00",
      status: "OVERDUE",
      publicToken: "tok_demo_inv0003_overdue_secret",
      notes: "Payment was due on Sept 5.",
      paymentInstructions: business.paymentInstructions,
      firstViewedAt: new Date("2026-08-22T09:00:00Z"),
    })
    .returning();

  await db.insert(invoiceItems).values([
    { invoiceId: inv3.id, description: "Video Editing & Animation Suite", quantity: "1.00", unitPrice: "1200.00", amount: "1200.00", sortOrder: 0 },
  ]);

  // Invoice 4: DRAFT
  const [inv4] = await db
    .insert(invoices)
    .values({
      businessId: business.id,
      clientId: client1.id,
      number: "INV-0004",
      issueDate: "2026-09-28",
      dueDate: "2026-10-12",
      currency: "USD",
      subtotal: "3500.00",
      taxRate: "10.00",
      taxAmount: "350.00",
      discountRate: "0.00",
      discountAmount: "0.00",
      total: "3850.00",
      amountPaid: "0.00",
      balanceDue: "3850.00",
      status: "DRAFT",
      publicToken: "tok_demo_inv0004_draft_secret",
      notes: "Draft retainer invoice for October.",
      paymentInstructions: business.paymentInstructions,
    })
    .returning();

  await db.insert(invoiceItems).values([
    { invoiceId: inv4.id, description: "Monthly Design Retainer (Oct 2026)", quantity: "1.00", unitPrice: "3500.00", amount: "3500.00", sortOrder: 0 },
  ]);

  // 7. Reminders History
  await db.insert(reminders).values([
    {
      invoiceId: inv3.id,
      businessId: business.id,
      reminderType: "overdue",
      message: "Hi Marcus, gentle reminder that invoice INV-0003 ($1,200.00) is now overdue. View here: http://localhost:3000/i/tok_demo_inv0003_overdue_secret",
      initiatedAt: new Date("2026-09-10T11:00:00Z"),
    },
  ]);

  // 8. Default Reminder Templates
  await db.insert(reminderTemplates).values([
    {
      businessId: business.id,
      type: "friendly",
      name: "Friendly Reminder",
      body: "Hi {client_name}, just a friendly reminder that invoice {invoice_number} for {total} is due on {due_date}. You can view and pay here: {public_url}",
    },
    {
      businessId: business.id,
      type: "due_today",
      name: "Due Today",
      body: "Hi {client_name}, invoice {invoice_number} for {balance} is due today ({due_date}). Please check the payment instructions here: {public_url}",
    },
    {
      businessId: business.id,
      type: "overdue",
      name: "Overdue Follow-up",
      body: "Hi {client_name}, invoice {invoice_number} was due on {due_date} and is currently overdue by {days_overdue} days. Outstanding balance: {balance}. Link: {public_url}",
    },
    {
      businessId: business.id,
      type: "final",
      name: "Final Notice",
      body: "FINAL NOTICE: Invoice {invoice_number} ({balance} remaining) is overdue. Please settle this payment immediately: {public_url}",
    },
  ]);

  console.log("🎉 Seed finished successfully!");
}

// Run directly if called via CLI
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}
