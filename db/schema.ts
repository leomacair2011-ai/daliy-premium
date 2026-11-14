import {sqliteTable,text,integer,index,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const threads=sqliteTable('support_threads',{
 id:text('id').primaryKey(),visitorKey:text('visitor_key').notNull(),name:text('name').notNull(),status:text('status').notNull().default('open'),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull(),ownerReadAt:integer('owner_read_at').notNull().default(0),visitorReadAt:integer('visitor_read_at').notNull().default(0)
},t=>[uniqueIndex('support_visitor').on(t.visitorKey),index('support_updated').on(t.updatedAt)]);
export const messages=sqliteTable('support_messages',{
 id:text('id').primaryKey(),threadId:text('thread_id').notNull().references(()=>threads.id),role:text('role').notNull(),body:text('body').notNull(),createdAt:integer('created_at').notNull(),requestId:text('request_id').notNull()
},t=>[index('support_messages_thread').on(t.threadId,t.createdAt),uniqueIndex('support_message_retry').on(t.threadId,t.requestId)]);
export const presence=sqliteTable('support_presence',{id:text('id').primaryKey(),available:integer('available').notNull().default(0),lastSeen:integer('last_seen').notNull().default(0)});
