
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  varchar,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// 1. Users (Normal InvoPing Customers)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Verification Codes (Passwordless OTPs)
export const verificationCodes = pgTable("verification_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  consumed: boolean("consumed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("verification_codes_email_idx").on(table.email),
}));

// 3. Platform Admin Users (Email + Password)
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("ADMIN").notNull(),
  active: boolean("active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminLoginAttempts = pgTable("admin_login_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  windowStartedAt: timestamp("window_started_at"),
  lockedUntil: timestamp("locked_until"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Businesses
export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  logoUrl: text("logo_url"),
  paymentInstructions: text("payment_instructions"),
  invoicePrefix: varchar("invoice_prefix", { length: 20 }).default("INV-").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 5. Business Members
export const businessMembers = pgTable("business_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default("OWNER").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userUniqueIdx: uniqueIndex("business_members_user_unique_idx").on(table.userId),
}));

// 6. Clients
export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  archived: boolean("archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  businessIdx: index("clients_business_idx").on(table.businessId),
}));

// 7. Invoices
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "restrict" }).notNull(),
  number: text("number").notNull(),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date").notNull(),

  // Original invoice currency.
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),

  // Business account currency when the invoice is created.
  reportingCurrency: varchar("reporting_currency", { length: 10 }),

  // Historical exchange rate for the invoice issue date.
  exchangeRate: numeric("exchange_rate", { precision: 24, scale: 12 }),

  // Invoice total converted into the reporting currency.
  convertedTotal: numeric("converted_total", { precision: 18, scale: 2 }),

  // Actual date of the exchange rate used.
  exchangeRateDate: text("exchange_rate_date"),

  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  discountRate: numeric("discount_rate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).default("0.00").notNull(),
  balanceDue: numeric("balance_due", { precision: 12, scale: 2 }).notNull(),
  status: text("status").default("DRAFT").notNull(),
  publicToken: text("public_token").notNull().unique(),
  notes: text("notes"),
  paymentInstructions: text("payment_instructions"),
  firstViewedAt: timestamp("first_viewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  businessIdx: index("invoices_business_idx").on(table.businessId),
  clientIdx: index("invoices_client_idx").on(table.clientId),
  publicTokenIdx: index("invoices_public_token_idx").on(table.publicToken),
  statusIdx: index("invoices_status_idx").on(table.status),
}));

// 8. Invoice Line Items
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
}, (table) => ({
  invoiceIdx: index("invoice_items_invoice_idx").on(table.invoiceId),
}));

// 9. Payments
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),

  // Original payment currency.
  currency: varchar("currency", { length: 10 }),

  // Business account currency at payment time.
  reportingCurrency: varchar("reporting_currency", { length: 10 }),

  // Reporting currency units per original currency unit.
  exchangeRate: numeric("exchange_rate", {
    precision: 24,
    scale: 12,
  }),

  // Converted payment amount.
  convertedAmount: numeric("converted_amount", {
    precision: 18,
    scale: 2,
  }),

  // Historical rate date.
  exchangeRateDate: text("exchange_rate_date"),

  paymentDate: text("payment_date").notNull(),
  method: text("method").default("Bank Transfer").notNull(),
  reference: text("reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  invoiceIdx: index("payments_invoice_idx").on(table.invoiceId),
  businessIdx: index("payments_business_idx").on(table.businessId),
}));

// 10. Reminders History
export const reminders = pgTable("reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  reminderType: text("reminder_type").notNull(),
  message: text("message").notNull(),
  initiatedAt: timestamp("initiated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  invoiceIdx: index("reminders_invoice_idx").on(table.invoiceId),
  businessIdx: index("reminders_business_idx").on(table.businessId),
}));

// 11. Custom Reminder Templates
export const reminderTemplates = pgTable("reminder_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  businessTypeUniqueIdx: uniqueIndex("reminder_templates_business_type_unique_idx").on(table.businessId, table.type),
}));

// 12. Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull().unique(),
  plan: text("plan").default("FREE").notNull(),
  status: text("status").default("ACTIVE").notNull(),
  currentPeriodStart: timestamp("current_period_start").defaultNow().notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 13. Monthly Usage Tracking
export const usage = pgTable("usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  periodStart: text("period_start").notNull(),
  invoiceCount: integer("invoice_count").default(0).notNull(),
  clientCount: integer("client_count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  businessPeriodIdx: index("usage_business_period_idx").on(table.businessId, table.periodStart),
}));

// 14. Customer Activity Logs
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  businessIdx: index("activity_logs_business_idx").on(table.businessId),
}));

// 15. Admin Activity Logs
export const adminActivityLogs = pgTable("admin_activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminId: uuid("admin_id").references(() => adminUsers.id, { onDelete: "cascade" }).notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  adminIdx: index("admin_activity_logs_admin_idx").on(table.adminId),
}));


export const supportConversations = pgTable(
  "support_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id),
    status: text("status", {
      enum: ["OPEN", "PENDING", "RESOLVED"],
    })
      .notNull()
      .default("OPEN"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("support_conversations_customer_id_unique").on(
      table.customerId
    ),
  ]
);


export const supportMessages = pgTable(
  "support_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => supportConversations.id),

    // Prevent duplicate messages when a customer retries sending.
    clientMessageId: uuid("client_message_id"),

    sender: text("sender", {
      enum: ["CUSTOMER", "SUPPORT"],
    }).notNull(),
    adminId: uuid("admin_id").references(() => adminUsers.id),
    text: text("text").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .notNull(),
  },
  (table) => [
    index("support_messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt
    ),
    index("support_messages_expires_at_idx").on(
      table.expiresAt
    ),

    // One message per client-generated ID within a conversation.
    uniqueIndex("support_messages_client_id_unique").on(
      table.conversationId,
      table.clientMessageId
    ),
  ]
);


export const supportAttachments = pgTable(
  "support_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => supportMessages.id, {
        onDelete: "cascade",
      }),
    kind: text("kind", {
      enum: ["IMAGE", "DOCUMENT"],
    }).notNull(),
    name: text("name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    storageKey: text("storage_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("support_attachments_message_id_idx").on(
      table.messageId
    ),
  ]
);



export const supportRateLimits = pgTable(
  "support_rate_limits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    windowStartedAt: timestamp("window_started_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    messageCount: integer("message_count")
      .notNull()
      .default(0),
  },
  (table) => [
    uniqueIndex("support_rate_limits_customer_unique").on(
      table.customerId
    ),
  ]
);
