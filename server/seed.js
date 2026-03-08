/**
 * Seed script — populates the database with a demo user and sample invoices.
 *
 * Usage:
 *   node seed.js          Seed if the demo user doesn't exist yet
 *   node seed.js --fresh   Drop existing demo data and re-seed
 *
 * Requires MONGO_URI, JWT_ACCESS_SECRET, and JWT_REFRESH_SECRET in .env
 */

import mongoose from 'mongoose';
import config from './config/index.js';
import User from './models/User.js';
import Invoice from './models/Invoice.js';
import AuditLog from './models/AuditLog.js';

const DEMO_EMAIL = 'demo@invio.app';

const fresh = process.argv.includes('--fresh');

async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  // Check for existing demo user
  let user = await User.findOne({ email: DEMO_EMAIL });

  if (user && !fresh) {
    console.log('Demo user already exists. Run with --fresh to re-seed.');
    await mongoose.disconnect();
    return;
  }

  if (user && fresh) {
    console.log('Removing existing demo data...');
    await Invoice.deleteMany({ user: user._id });
    await AuditLog.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });
    user = null;
  }

  // Create demo user
  user = await User.create({
    name: 'Demo User',
    email: DEMO_EMAIL,
    password: 'demo1234',
    businessName: 'Invio Demo Co.',
    businessEmail: 'billing@invio.app',
    businessPhone: '+1 (555) 123-4567',
    businessAddress: '100 Innovation Drive, San Francisco, CA 94107',
    taxId: 'US-12-3456789',
  });

  console.log(`Created demo user: ${user.email}`);

  // Sample invoices in various statuses
  const now = new Date();
  const day = (d) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);

  const invoiceData = [
    {
      clientName: 'Acme Corporation',
      clientEmail: 'accounts@acme.example.com',
      clientPhone: '+1 (555) 987-6543',
      clientAddress: '200 Commerce Blvd, Austin, TX 78701',
      issueDate: day(-30),
      dueDate: day(-1),
      status: 'paid',
      items: [
        { description: 'Website Redesign', quantity: 1, rate: 4500 },
        { description: 'SEO Audit', quantity: 1, rate: 1200 },
        { description: 'Content Migration', quantity: 3, rate: 400 },
      ],
      taxRate: 8,
      discount: 200,
      notes: 'Thank you for your prompt payment!',
    },
    {
      clientName: 'Globex Industries',
      clientEmail: 'finance@globex.example.com',
      clientAddress: '50 Future Ave, Denver, CO 80202',
      issueDate: day(-15),
      dueDate: day(15),
      status: 'sent',
      items: [
        { description: 'Monthly SaaS Subscription', quantity: 12, rate: 99 },
        { description: 'Custom Integration Setup', quantity: 8, rate: 150 },
      ],
      taxRate: 5,
    },
    {
      clientName: 'Wayne Enterprises',
      clientEmail: 'procurement@wayne.example.com',
      clientPhone: '+1 (555) 222-3333',
      clientAddress: '1 Gotham Center, Gotham, NJ 07093',
      issueDate: day(-45),
      dueDate: day(-10),
      status: 'overdue',
      items: [
        { description: 'Security Consulting', quantity: 40, rate: 200 },
        { description: 'Penetration Testing', quantity: 1, rate: 5000 },
      ],
      taxRate: 7,
      notes: 'Payment is past due. Please remit at your earliest convenience.',
    },
    {
      clientName: 'Stark Solutions',
      clientEmail: 'ap@stark.example.com',
      clientAddress: '10880 Malibu Point, Malibu, CA 90265',
      issueDate: day(-5),
      dueDate: day(25),
      status: 'draft',
      items: [
        { description: 'AI Model Training (Phase 1)', quantity: 1, rate: 12000 },
        { description: 'Data Pipeline Architecture', quantity: 1, rate: 8000 },
        { description: 'Cloud Infrastructure Setup', quantity: 1, rate: 3500 },
      ],
      taxRate: 10,
      discount: 1000,
      terms: 'Net 30 from date of invoice.',
    },
    {
      clientName: 'Umbrella Corp',
      clientEmail: 'billing@umbrella.example.com',
      issueDate: day(-60),
      dueDate: day(-30),
      status: 'paid',
      items: [
        { description: 'Database Optimization', quantity: 20, rate: 175 },
      ],
      taxRate: 6,
    },
    {
      clientName: 'Pied Piper Inc.',
      clientEmail: 'richard@piedpiper.example.com',
      clientPhone: '+1 (555) 444-5556',
      clientAddress: '5230 Newell Road, Palo Alto, CA 94303',
      issueDate: day(-3),
      dueDate: day(27),
      status: 'draft',
      items: [
        { description: 'Compression Algorithm Consulting', quantity: 16, rate: 250 },
        { description: 'Code Review & Refactoring', quantity: 24, rate: 180 },
      ],
      taxRate: 9.25,
      discount: 500,
      notes: 'First project engagement — introductory discount applied.',
    },
    {
      clientName: 'Initech LLC',
      clientEmail: 'invoices@initech.example.com',
      issueDate: day(-20),
      dueDate: day(10),
      status: 'sent',
      items: [
        { description: 'TPS Report Automation', quantity: 1, rate: 2500 },
        { description: 'Workflow Optimization', quantity: 10, rate: 150 },
      ],
      taxRate: 0,
    },
    {
      clientName: 'Hooli',
      clientEmail: 'vendor-pay@hooli.example.com',
      clientAddress: '1 Hooli Way, Mountain View, CA 94043',
      issueDate: day(-90),
      dueDate: day(-60),
      status: 'paid',
      items: [
        { description: 'Mobile App Development (iOS)', quantity: 1, rate: 25000 },
        { description: 'Mobile App Development (Android)', quantity: 1, rate: 22000 },
        { description: 'QA & Testing', quantity: 80, rate: 100 },
      ],
      taxRate: 8.5,
      discount: 2000,
    },
  ];

  let created = 0;
  for (const data of invoiceData) {
    const invoiceNumber = await Invoice.generateInvoiceNumber();
    await Invoice.create({ ...data, user: user._id, invoiceNumber });
    created++;
  }

  console.log(`Created ${created} sample invoices`);
  console.log('\nDemo credentials:');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log('  Password: demo1234');

  await mongoose.disconnect();
  console.log('\nDone.');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
