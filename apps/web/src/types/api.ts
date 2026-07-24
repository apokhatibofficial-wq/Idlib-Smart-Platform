// Mirrors apps/api response shapes. Kept hand-in-sync with the NestJS DTOs/entities
// (no shared package between the two apps by design — see root README).

export type Role = 'CITIZEN' | 'MERCHANT' | 'ADMIN';
export type AuthProvider = 'LOCAL' | 'GOOGLE';

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string | null;
  role: Role;
  authProvider: AuthProvider;
  emailVerifiedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string; category: StoreCategory } | null;
}

export interface ApiEnvelope<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

// ---------------------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------------------

export type ComplaintCategory = 'ROADS' | 'CLEANLINESS' | 'PRICING' | 'BRIBERY';
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ComplaintStatus = 'UNDER_REVIEW' | 'IN_PROGRESS' | 'RESOLVED';
export type AttachmentKind = 'PHOTO' | 'VIDEO';

export interface ComplaintAttachment {
  id: string;
  url: string;
  kind: AttachmentKind;
  mimeType: string;
}

export interface ComplaintStatusEvent {
  status: ComplaintStatus;
  note: string | null;
  createdAt: string;
}

export interface Complaint {
  id: string;
  displayId: string;
  category: ComplaintCategory;
  categoryLabel: string;
  status: ComplaintStatus;
  statusLabel: string;
  priority: ComplaintPriority;
  priorityLabel: string;
  description: string;
  locationLabel: string | null;
  latitude: string | null;
  longitude: string | null;
  attachments: ComplaintAttachment[];
  statusEvents: ComplaintStatusEvent[];
  citizen?: { fullName: string; email: string };
  employeeName?: string | null;
  witness1?: string | null;
  witness2?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintCategoryOption {
  key: ComplaintCategory;
  label: string;
}

// ---------------------------------------------------------------------------
// Marketplace
// ---------------------------------------------------------------------------

export type StoreCategory = 'FOOD' | 'CLOTHES' | 'ELECTRONICS' | 'HEALTH' | 'OTHER';
export type ProductAvailability = 'AVAILABLE' | 'OUT_OF_STOCK';
export type OrderStatus = 'NEW' | 'PREPARING' | 'DELIVERED' | 'CANCELLED';
export type CouponStatus = 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED';

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  category: StoreCategory;
  categoryLabel: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  ratingAvg: string;
  ratingCount: number;
  deliveryAvailable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  availability: ProductAvailability;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoreDetail extends Store {
  products: Product[];
}

export interface Order {
  id: string;
  displayId: string;
  status: OrderStatus;
  statusLabel: string;
  quantity: number;
  note: string | null;
  productName: string;
  price: string;
  storeName: string;
  createdAt: string;
}

export interface MarketCategoryOption {
  key: StoreCategory | 'all';
  label: string;
}

export interface Coupon {
  id: string;
  storeId: string;
  code: string;
  percentOff: number;
  status: CouponStatus;
  expiresAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export type ConversationType = 'DIRECT' | 'COMPLAINT_THREAD' | 'SUPPORT';

export interface ChatListItem {
  id: string;
  type: ConversationType;
  name: string;
  last: string;
  time: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  body: string;
  mine: boolean;
  system: boolean;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  name: string;
  messages: ChatMessage[];
}

// ---------------------------------------------------------------------------
// News & alerts
// ---------------------------------------------------------------------------

export interface NewsItem {
  id: string;
  title: string;
  body: string | null;
  tag: string;
  imageUrl: string | null;
  publishedAt: string;
  time: string;
}

export interface Alert {
  id: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Business accounts
// ---------------------------------------------------------------------------

export type BusinessAccountStatus = 'PENDING_PAYMENT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface BusinessAccountRequest {
  id: string;
  applicantId: string;
  businessName: string;
  registrationNumber: string;
  phone: string;
  category: StoreCategory;
  logoUrl: string | null;
  photoUrls: string[];
  description: string;
  firstProductName: string;
  firstProductPrice: string;
  firstProductAvailable: ProductAvailability;
  feeUsd: string;
  status: BusinessAccountStatus;
  paidAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  applicant?: { fullName: string; email: string };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface AdminOverview {
  users: number;
  openComplaints: number;
  pendingBusinessAccounts: number;
  publishedNews: number;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: Role;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  ip: string | null;
  createdAt: string;
  actor?: { fullName: string; email: string; role: Role } | null;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Merchant
// ---------------------------------------------------------------------------

export interface MerchantOverview {
  storeName: string;
  productCount: number;
  orderCount: number;
  customerCount: number;
  salesTotal: number;
}

export interface MerchantOrder {
  id: string;
  displayId: string;
  product: string;
  customer: string;
  status: OrderStatus;
  statusLabel: string;
  quantity: number;
  createdAt: string;
}

export interface WeeklyChartBucket {
  date: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Uploads / assistant
// ---------------------------------------------------------------------------

export interface UploadedFile {
  url: string;
  mimeType: string;
  sizeBytes: number;
  kind: 'image' | 'video';
}

export interface AssistantAnswer {
  answer: string;
}
