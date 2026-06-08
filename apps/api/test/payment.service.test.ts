import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  SandboxPaymentProvider, 
  StripePaymentProvider, 
  RazorpayPaymentProvider, 
  PaymentServiceFactory 
} from '../src/services/payment.service';
import * as crypto from 'crypto';

describe('SandboxPaymentProvider', () => {
  let provider: SandboxPaymentProvider;

  beforeEach(() => {
    provider = new SandboxPaymentProvider();
  });

  it('should successfully create sandbox order', async () => {
    const res = await provider.createOrder({
      userId: 'test-user-id',
      amount: 29,
      currency: 'USD',
      planName: 'PRO'
    });

    expect(res.orderId).toBeDefined();
    expect(res.orderId.startsWith('sandbox_tx_')).toBe(true);
    expect(res.amount).toBe(29);
    expect(res.provider).toBe('sandbox');
    expect(res.paymentUrl).toContain('sandbox_checkout=true');
    expect(res.paymentUrl).toContain('plan=PRO');
  });

  it('should verify webhook with correct signature', async () => {
    const payload = JSON.stringify({
      txRef: 'sandbox_tx_123',
      status: 'COMPLETED',
      amount: 29,
      metadata: { planName: 'PRO' }
    });

    const headers = { 'x-sandbox-signature': 'sandbox_secret_key_123!' };
    const res = await provider.verifyWebhook(headers, payload);

    expect(res.isValid).toBe(true);
    expect(res.txRef).toBe('sandbox_tx_123');
    expect(res.status).toBe('COMPLETED');
    expect(res.amount).toBe(29);
  });

  it('should reject webhook with incorrect signature', async () => {
    const payload = JSON.stringify({ txRef: 'sandbox_tx_123', status: 'COMPLETED' });
    const headers = { 'x-sandbox-signature': 'wrong-signature' };
    const res = await provider.verifyWebhook(headers, payload);

    expect(res.isValid).toBe(false);
  });
});

describe('StripePaymentProvider', () => {
  let provider: StripePaymentProvider;

  beforeEach(() => {
    provider = new StripePaymentProvider();
  });

  it('should create stripe session mock order', async () => {
    const res = await provider.createOrder({
      userId: 'test-user-id',
      amount: 99,
      currency: 'USD',
      planName: 'LABS'
    });

    expect(res.orderId.startsWith('stripe_sess_')).toBe(true);
    expect(res.clientSecret).toBeDefined();
    expect(res.provider).toBe('stripe');
  });

  it('should verify signature using fallback path', async () => {
    const payload = JSON.stringify({
      txRef: 'stripe_tx_123',
      status: 'COMPLETED',
      amount: 99,
      metadata: { planName: 'LABS' }
    });

    const headers = { 'stripe-signature': 'mock_stripe_test_sig' };
    const res = await provider.verifyWebhook(headers, payload);

    expect(res.isValid).toBe(true);
    expect(res.txRef).toBe('stripe_tx_123');
    expect(res.status).toBe('COMPLETED');
  });
});

describe('RazorpayPaymentProvider', () => {
  let provider: RazorpayPaymentProvider;

  beforeEach(() => {
    provider = new RazorpayPaymentProvider();
  });

  it('should create razorpay order reference', async () => {
    const res = await provider.createOrder({
      userId: 'test-user-id',
      amount: 29,
      currency: 'USD'
    });

    expect(res.orderId.startsWith('razor_order_')).toBe(true);
    expect(res.provider).toBe('razorpay');
  });

  it('should verify signature using computed HMAC', async () => {
    const secret = 'razorpay_secret_fallback';
    const payload = JSON.stringify({
      txRef: 'razor_tx_123',
      status: 'COMPLETED',
      amount: 29
    });

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const headers = { 'x-razorpay-signature': expectedSignature };
    const res = await provider.verifyWebhook(headers, payload);

    expect(res.isValid).toBe(true);
    expect(res.status).toBe('COMPLETED');
  });
});

describe('PaymentServiceFactory', () => {
  const originalEnv = process.env.PAYMENT_PROVIDER;

  afterEach(() => {
    process.env.PAYMENT_PROVIDER = originalEnv;
  });

  it('should return SandboxProvider by default', () => {
    delete process.env.PAYMENT_PROVIDER;
    const provider = PaymentServiceFactory.getProvider();
    expect(provider).toBeInstanceOf(SandboxPaymentProvider);
  });

  it('should return StripeProvider when environment demands', () => {
    process.env.PAYMENT_PROVIDER = 'stripe';
    const provider = PaymentServiceFactory.getProvider();
    expect(provider).toBeInstanceOf(StripePaymentProvider);
  });

  it('should return RazorpayProvider when environment demands', () => {
    process.env.PAYMENT_PROVIDER = 'razorpay';
    const provider = PaymentServiceFactory.getProvider();
    expect(provider).toBeInstanceOf(RazorpayPaymentProvider);
  });
});
