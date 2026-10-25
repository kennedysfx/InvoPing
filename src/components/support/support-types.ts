export type SupportConversationStatus =
  | "OPEN"
  | "WAITING_FOR_SUPPORT"
  | "WAITING_FOR_CUSTOMER"
  | "CLOSED";

export type SupportMessageStatus =
  | "SENDING"
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED";

export type SupportAttachmentKind = "IMAGE" | "DOCUMENT";

// An attachment already stored by the future backend.
export interface SupportAttachment {
  id: string;
  kind: SupportAttachmentKind;
  name: string;
  mimeType: string;
  size: number;
  url: string;
}

// A locally selected file. It has not been uploaded.
export interface SupportDraftAttachment {
  id: string;
  kind: SupportAttachmentKind;
  file: File;
  previewUrl?: string;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  sender: "CUSTOMER" | "SUPPORT";
  senderName?: string;
  text: string;
  attachments: SupportAttachment[];
  createdAt: string;
  status?: SupportMessageStatus;
}

export interface SupportConversation {
  id: string;
  customerId: string;
  businessId?: string;
  status: SupportConversationStatus;
  createdAt: string;
  updatedAt: string;
}

// Only the customer details needed by the support interface.
export interface SupportCustomer {
  userId: string;
  email: string;
  businessId?: string;
}

export interface SupportTopic {
  id: string;
  title: string;
  starterMessage: string;
}

export interface SupportMessageInput {
  text: string;
  files: File[];
}

export type SupportChatState =
  | "READY"
  | "LOADING"
  | "ERROR"
  | "UNAVAILABLE";