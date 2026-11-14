import {sqliteTable,text,integer,index,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const threads=sqliteTable('support_threads',{
 id:text('id').primaryKey(),visitorKey:text('visitor_key').notNull(),name:text('name').notNull(),status:text('status').notNull().default('open'),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull(),ownerReadAt:integer('owner_read_at').notNull().default(0),visitorReadAt:integer('visitor_read_at').notNull().default(0)
},t=>[uniqueIndex('support_visitor').on(t.visitorKey),index('support_updated').on(t.updatedAt)]);
export const messages=sqliteTable('support_messages',{
 id:text('id').primaryKey(),threadId:text('thread_id').notNull().references(()=>threads.id),role:text('role').notNull(),body:text('body').notNull(),createdAt:integer('created_at').notNull(),requestId:text('request_id').notNull()
},t=>[index('support_messages_thread').on(t.threadId,t.createdAt),uniqueIndex('support_message_retry').on(t.threadId,t.requestId)]);
export const presence=sqliteTable('support_presence',{id:text('id').primaryKey(),available:integer('available').notNull().default(0),lastSeen:integer('last_seen').notNull().default(0)});
export const catalogue=sqliteTable('catalogue_products',{
 id:text('id').primaryKey(),data:text('data').notNull(),state:text('state').notNull().default('draft'),revision:integer('revision').notNull().default(1),updatedAt:integer('updated_at').notNull()
});
export const media=sqliteTable('product_media',{
 id:text('id').primaryKey(),objectKey:text('object_key').notNull(),name:text('name').notNull(),contentType:text('content_type').notNull(),size:integer('size').notNull(),createdAt:integer('created_at').notNull()
});
export const orders=sqliteTable('orders',{
 id:text('id').primaryKey(),itemsJson:text('items_json').notNull(),totalPence:integer('total_pence').notNull(),currency:text('currency').notNull(),status:text('status').notNull().default('pending'),createdAt:integer('created_at').notNull(),ipHash:text('ip_hash').notNull(),stripeSessionId:text('stripe_session_id'),customerJson:text('customer_json'),paidAt:integer('paid_at'),fulfilment:text('fulfilment').notNull().default('unfulfilled'),tracking:text('tracking').notNull().default(''),notes:text('notes').notNull().default(''),revision:integer('revision').notNull().default(1),updatedAt:integer('updated_at').notNull().default(0)
},t=>[uniqueIndex('order_stripe_session').on(t.stripeSessionId),index('order_created').on(t.createdAt),index('order_ip_created').on(t.ipHash,t.createdAt)]);
